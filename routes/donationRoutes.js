const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

router.post('/submit', donationController.submitDonation);
router.get('/list', donationController.getAllDonations);
router.get('/:id', donationController.getDonationById);

module.exports = router;
