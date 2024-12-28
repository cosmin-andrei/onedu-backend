// backend/routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Exemplu de rută pentru trimiterea email-urilor
router.post('/send', emailController.sendEmail);

module.exports = router;
