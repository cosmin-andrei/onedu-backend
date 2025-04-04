const {User, Donation, SmartPayment, SmartPayTransaction, NetopiaTransaction} = require('../models');
const smartPayService = require('../services/smartPayService');
const {startPaymentService, verifyNetopiaStatus} = require('../services/netopiaService');
const Joi = require('joi');
const logger = require('../utils/logger');
require('dotenv').config();

const donationSchema = Joi.object({
    nume: Joi.string().required(),
    prenume: Joi.string().required(),
    email: Joi.string().email().required(),
    suma: Joi.number().positive().required(),
    frecventa: Joi.string().valid('one_time', 'lunar').required(),
    metoda_plata: Joi.string().valid('smartpay', 'netopia').required(),
    newsletter: Joi.boolean().optional(),
    telefon: Joi.string().when('metoda_plata', {
        is: 'netopia',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    banca: Joi.string().when('metoda_plata', {
        is: 'smartpay',
        then: Joi.required(),
        otherwise: Joi.forbidden(),
    }),
});

async function retryTransaction(fn, maxRetries = 5, delay = 100) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (error.message.includes("SQLITE_BUSY")) {
                console.warn(`\uD83D\uDD04 Retry SQLite transaction (${i + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Eroare: SQLite blocat chiar și după multiple încercări.");
}

exports.submitDonation = async (req, res) => {
    const {error} = donationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({message: error.details[0].message});
    }

    await retryTransaction(async () => {
        const {nume, prenume, email, suma, frecventa, metoda_plata, banca, telefon, newsletter} = req.body;
        const {sequelize} = require('../models');
        const transaction = await sequelize.transaction();

        try {
            let user = await User.findOne({where: {email}}, {transaction}) ||
                await User.create({
                    first_name: nume,
                    last_name: prenume,
                    email,
                    telefon: metoda_plata === 'netopia' ? telefon : null,
                    newsletter,
                }, {transaction});

            const donation = await Donation.create({
                idUser: user.id,
                suma,
                stare: 'pending',
                tip_donatie: frecventa,
                metoda_plata,
            }, {transaction});

            logger.info('Donație nouă:', {user, donation});

            let redirectUri = null;
            let paymentId = null;

            if (metoda_plata === 'smartpay') {
                const {
                    access_token,
                    refresh_token,
                    paymentId: smartPayPaymentId
                } = await smartPayService.authenticate();
                const tokens = {access_token, refresh_token};

                const smartPayTransaction = await SmartPayTransaction.create({
                    donationId: donation.id,
                    paymentId: smartPayPaymentId,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    recurring: frecventa === 'lunar',
                    status: 'waiting_payment'
                }, {transaction});

                const initPaymentResponse = frecventa === 'one_time'
                    ? await smartPayService.initPayment(smartPayPaymentId, banca, suma, tokens, user.id, user.email)
                    : await smartPayService.initRecurringPayment(smartPayPaymentId, banca, suma, tokens, user.id, user.email);

                if (initPaymentResponse?.status === 200) {
                    redirectUri = initPaymentResponse.redirectUri;
                    paymentId = smartPayPaymentId;
                    await smartPayTransaction.update({status: 'waiting_payment'}, {transaction});
                } else {
                    await smartPayTransaction.update({status: 'failed'}, {transaction});
                    await transaction.commit();
                    return res.status(500).json({message: `Eroare la inițializarea donației prin SmartPay.`});
                }
            } else if (metoda_plata === 'netopia') {
                const startRequest = {
                    config: {
                        redirectUrl: process.env.NETOPIA_RETURN_URL,
                        language: 'ro',
                        sandbox: true,
                        cancelUrl: process.env.CANCEL_URL || ''
                    },
                    order: {
                        orderID: `ONEDU-${Date.now()}`,
                        amount: suma,
                        currency: "RON",
                        description: 'Donatie Asociatia ONedu',
                        billing: {
                            email: user.email,
                            phone: user.telefon,
                            firstName: user.first_name,
                            lastName: user.last_name,
                        }
                    }
                };

                const initPaymentResponse = await startPaymentService(startRequest);

                if (initPaymentResponse && initPaymentResponse.env_key && initPaymentResponse.data) {
                    redirectUri = initPaymentResponse.url;
                    paymentId = startRequest.order.orderID;
                    logger.info('Plată inițializată:', {initPaymentResponse});
                    await NetopiaTransaction.create({
                        donationId: donation.id,
                        paymentId,
                        envKey: initPaymentResponse.env_key,
                        data: initPaymentResponse.data,
                        status: 'waiting_payment'
                    }, {transaction});
                } else {
                    await transaction.commit();
                    return res.status(500).json({message: `Eroare la inițializarea donației prin Netopia.`});
                }
            }

            await transaction.commit();
            return res.status(200).json({
                message: `Plata ${frecventa === 'one_time' ? 'unică' : 'recurentă'} prin ${metoda_plata} inițializată. Așteptare confirmare.`,
                redirectUri
            });

        } catch (error) {
            await transaction.rollback();
            logger.error('Eroare la trimiterea donației:', {
                error: error.message,
                details: error.response?.data || null,
            });
            throw error;
        }
    });
};

exports.getDonationById = async (req, res) => {
    const {id} = req.params;

    try {
        const donation = await Donation.findByPk(id);
        if (!donation) {
            return res.status(404).json({message: 'Donația nu a fost găsită.'});
        }
        res.status(200).json(donation);
    } catch (error) {
        logger.error('Eroare la obținerea donației:', error);
        res.status(500).json({message: 'A apărut o eroare la obținerea donației.'});
    }
};

exports.getUserDonations = async (req, res) => {
    const {userId} = req.params;

    try {
        const donations = await Donation.findAll({where: {idUser: userId}});
        res.status(200).json(donations);
    } catch (error) {
        logger.error('Eroare la obținerea donațiilor utilizatorului:', error);
        res.status(500).json({message: 'A apărut o eroare la obținerea donațiilor utilizatorului.'});
    }
};

exports.getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.findAll();
        res.status(200).json(donations);
    } catch (error) {
        logger.error('Eroare la obținerea donațiilor:', error);
        res.status(500).json({message: 'A apărut o eroare la obținerea donațiilor.'});
    }
};

exports.getDonationsReport = async (req, res) => {
    const {startDate, endDate} = req.query;
    const {Op} = require('sequelize');

    try {
        const donations = await Donation.findAll({
            where: {
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)],
                },
            },
        });
        res.status(200).json({
            donations,
            total: donations.length,
        });
    } catch (error) {
        logger.error('Eroare la generarea raportului donațiilor:', error);
        res.status(500).json({message: 'A apărut o eroare la generarea raportului.'});
    }
};

exports.setNetopiaPaymentStatus = async (req, res) => {
    const {orderId} = req.body;
    if (!orderId) {
        return res.status(400).json({message: "Lipsă orderId"});
    }
    let donation = await Donation.findOne({where: {paymentId: orderId}});
    let response = verifyNetopiaStatus(donation.env_key, donation.data);
    if (response === 'confirmed' || response === 'paid') {
        await Donation.update(
            {stare: 'confirmed'},
            {where: {paymentId: orderId}}
        );
        return res.status(200).json({success: true, message: "Plată confirmată"});
    } else {
        return res.status(500).json({success: false, message: "Plată neconfirmată"});
    }

};

exports.setSmartPayStatus = async (req, res) => {

    const {orderId} = req.body;
    if (!orderId) {
        logger.error("Lipsă orderId în request:", req.body);
        return res.status(400).json({message: "Lipsă orderId"});
    }

    let smartPayTransaction = await SmartPayTransaction.findOne({where: {paymentId: orderId}});

    if (!smartPayTransaction) {
        return res.status(404).json({message: "Plata nu a fost găsită în SmartPayTransactions"});
    }

    let response = await smartPayService.checkPaymentStatus(orderId, smartPayTransaction.accessToken, smartPayTransaction.refreshToken);

    if (response.messageStatus === 'SUCCESS') {
        await smartPayTransaction.update({status: 'confirmed'});
        await Donation.update({stare: 'confirmed'}, {where: {id: smartPayTransaction.donationId}});
        return res.status(200).json({success: true, message: "Plată confirmată"});
    }


};

exports.getDonationsCount = async (req, res) => {
    const {Op} = require('sequelize');
    const {startOfMonth, endOfMonth} = require('date-fns');
    const {count} = await Donation.findAndCountAll({
        where: {
            createdAt: {
                [Op.between]: [startOfMonth(new Date()), endOfMonth(new Date())],
            },
        },
    });
    return count;
}