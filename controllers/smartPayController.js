// controllers/smartPayController.js

const { DonationOneTime } = require('../models');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Controller pentru gestionarea webhook-urilor SmartPay
 */
exports.handleWebhook = async (req, res) => {
    const signature = req.headers['x-smartpay-signature'];
    const payload = JSON.stringify(req.body);
    const { SMARTPAY_WEBHOOK_SECRET } = process.env;

    // Verificarea semnăturii pentru securitate
    const expectedSignature = crypto
        .createHmac('sha256', SMARTPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        logger.error('Webhook SmartPay semnătură invalidă.');
        return res.status(400).json({ message: 'Invalid signature' });
    }

    const { paymentId, status, frequency } = req.body;

    try {
        if (frequency === 'one-time') {
            const donation = await DonationOneTime.findOne({ where: { paymentId } });
            if (donation) {
                donation.stare = status;
                await donation.save();
                logger.info(`Donație One-Time actualizată: ${paymentId} -> ${status}`);
            } else {
                logger.warn(`Donație One-Time nu a fost găsită pentru paymentId: ${paymentId}`);
            }
        }

        res.status(200).json({ message: 'Webhook SmartPay procesat cu succes' });
    } catch (error) {
        logger.error('Eroare la procesarea webhook-ului SmartPay:', { error: error.message });
        res.status(500).json({ message: 'Eroare la procesarea webhook-ului' });
    }
};
