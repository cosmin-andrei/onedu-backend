const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

router.post('/submit', donationController.submitDonation);
router.get('/list', donationController.getAllDonations);
router.get('/:id', donationController.getDonationById);
router.post('/status/netopia', donationController.setNetopiaPaymentStatus);
router.post('/status/smartpay', donationController.setSmartPayStatus);

module.exports = router;
