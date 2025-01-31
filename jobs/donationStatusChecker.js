const cron = require('node-cron');
const { DonationOneTime } = require('../models');
const smartPayService = require('../services/smartPayService');
const logger = require('../utils/logger');

cron.schedule('*/15 * * * *', async () => {
    logger.log('Verificare status.');

    try {
        const donations = await DonationOneTime.findAll({ where: { stare: 'waiting_payment' } });

        if (!donations.length) {
            logger.log('Nu exista donatii.');
            return;
        }

        for (const donation of donations) {
            try {
                const paymentStatus = await smartPayService.checkPaymentStatus(donation.paymentId);

                if (paymentStatus.status === 'completed') {
                    donation.stare = 'completed';
                    await donation.save();
                    logger.log(`Plata ${donation.paymentId} finalizata.`);
                } else if (paymentStatus.status === 'failed') {
                    donation.stare = 'failed';
                    await donation.save();
                    logger.log(`Plata ${donation.paymentId} esuata.`);
                } else {
                    logger.log(`Plata ${donation.paymentId} este in asteptare.`);
                }
            } catch (error) {
                logger.error(`Eroare la verificarea statusului pentru donația ${donation.paymentId}:`, error.message);
            }
        }
    } catch (error) {
        logger.error('Eroare la verificarea donațiilor:', error.message);
    }
});
