// routes/donationRoutes.js
const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

// Endpoint pentru trimiterea donației
router.post('/submit', donationController.submitDonation);

module.exports = router;
