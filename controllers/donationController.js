const {User, DonationOneTime, DonationLunar} = require('../models');
const smartPayService = require('../services/smartPayService');
const Joi = require('joi');
const logger = require('../utils/logger');

const donationSchema = Joi.object({
    nume: Joi.string().required(),
    prenume: Joi.string().required(),
    email: Joi.string().email().required(),
    telefon: Joi.string().pattern(/^[0-9]{10}$/).required(),
    suma: Joi.number().positive().required(),
    frecventa: Joi.string().valid('OneTime', 'Lunar').required(),
    banca: Joi.string().required(),
    newsletter: Joi.boolean().required(),
});

exports.getDonationById = async (req, res) => {
    const {id} = req.params;

    try {
        const donation = await DonationOneTime.findByPk(id) || await DonationLunar.findByPk(id);

        if (!donation) {
            return res.status(404).json({message: 'Donația nu a fost găsită.'});
        }

        res.status(200).json(donation);
    } catch (error) {
        console.error('Eroare la obținerea donației:', error);
        res.status(500).json({message: 'A apărut o eroare la obținerea donației.'});
    }
};


exports.submitDonation = async (req, res) => {
    const {error} = donationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({message: error.details[0].message});
    }
    const {
        nume,
        prenume,
        email,
        telefon,
        suma,
        frecventa,
        banca,
        newsletter,
    } = req.body;

    const {sequelize} = require('../models');
    const transaction = await sequelize.transaction();

    let donation = null;

    try {
        let user = await User.findOne({where: {email}});
        if (!user) {
            user = await User.create({
                first_name: nume,
                last_name: prenume,
                email,
                telefon,
                newsletter,
            }, {transaction});
        }

        if (frecventa === 'OneTime') {
            donation = await DonationOneTime.create({
                idUser: user.id,
                suma,
                stare: 'pending',
            }, {transaction});
        } else if (frecventa === 'Lunar') {
            donation = await DonationLunar.create({
                idUser: user.id,
                suma,
                stare: 'pending',
            }, {transaction});
        }

        const authResponse = await smartPayService.authenticate();
        const {access_token, refresh_token, paymentId} = authResponse;

        const tokens = {access_token, refresh_token};

        if (frecventa === 'OneTime') {
            const initPaymentResponse = await smartPayService.initPayment(paymentId, banca, suma, tokens, user.id, user.email);

            console.log('Răspuns de la initPayment:', initPaymentResponse);

            if (initPaymentResponse.status === 200) {
                donation.stare = 'waiting_payment';
                donation.paymentId = paymentId;
                await donation.save({transaction});
                await transaction.commit();

                return res.status(200).json({
                    message: 'Plata inițializată. Așteptare confirmare.',
                    redirectUri: initPaymentResponse.redirectUri,
                });
            } else {
                donation.stare = 'failed';
                donation.paymentId = paymentId || null;
                await donation.save({transaction});
                await transaction.commit();
                return res.status(500).json({message: 'Eroare la inițializarea donației unice'});
            }
        } else if (frecventa === 'Lunar') {
            const initRecurringPaymentResponse = await smartPayService.initRecurringPayment(paymentId, banca, suma, tokens, user.id, user.email);

            console.log('Răspuns de la initRecurringPayment:', initRecurringPaymentResponse);

            if (initRecurringPaymentResponse.status === 200) {
                donation.stare = 'waiting_payment'; // Setăm starea ca `waiting_payment`
                donation.paymentId = paymentId;
                await donation.save({transaction});
                await transaction.commit();

                return res.status(200).json({
                    message: 'Plata recurentă inițializată. Așteptare confirmare.',
                    redirectUri: initRecurringPaymentResponse.redirectUri,
                });
            } else {
                donation.stare = 'failed';
                donation.paymentId = paymentId || null;
                await donation.save({transaction});
                await transaction.commit();
                return res.status(500).json({message: 'Eroare la inițializarea donației recurente'});
            }
        } else {
            throw new Error('Tip de frecvență invalid.');
        }
    } catch (error) {
        await transaction.rollback();

        logger.error('Eroare la trimiterea donației:', {
            error: error.message,
            details: error.response ? error.response.data : null,
        });

        if (donation) {
            try {
                await donation.update({stare: 'failed'});
            } catch (updateError) {
                logger.error('Eroare la actualizarea stării donației:', {error: updateError.message});
            }
        }

        return res.status(500).json({
            message: 'A apărut o eroare la trimiterea donației.',
            error: error.message,
        });
    }
};

exports.getUserDonations = async (req, res) => {
    const { userId } = req.params;

    try {
        const oneTimeDonations = await DonationOneTime.findAll({ where: { idUser: userId } });
        const recurringDonations = await DonationLunar.findAll({ where: { idUser: userId } });

        res.status(200).json({
            oneTimeDonations,
            recurringDonations,
        });
    } catch (error) {
        console.error('Eroare la obținerea donațiilor utilizatorului:', error);
        res.status(500).json({ message: 'A apărut o eroare la obținerea donațiilor utilizatorului.' });
    }
};

exports.getAllDonations = async (req, res) => {
    try {
        const oneTimeDonations = await DonationOneTime.findAll();
        const recurringDonations = await DonationLunar.findAll();

        res.status(200).json({
            oneTimeDonations,
            recurringDonations,
        });
    } catch (error) {
        console.error('Eroare la obținerea donațiilor:', error);
        res.status(500).json({ message: 'A apărut o eroare la obținerea donațiilor.' });
    }
};

exports.getDonationsReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        const oneTimeDonations = await DonationOneTime.findAll({
            where: {
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)],
                },
            },
        });

        const recurringDonations = await DonationLunar.findAll({
            where: {
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)],
                },
            },
        });

        res.status(200).json({
            oneTimeDonations,
            recurringDonations,
            total: oneTimeDonations.length + recurringDonations.length,
        });
    } catch (error) {
        console.error('Eroare la generarea raportului donațiilor:', error);
        res.status(500).json({ message: 'A apărut o eroare la generarea raportului.' });
    }
};

