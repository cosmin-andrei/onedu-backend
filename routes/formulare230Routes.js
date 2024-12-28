// backend/routes/formulare230Routes.js
const express = require('express');
const router = express.Router();
const formulare230Controller = require('../controllers/formulare230Controller');

// Endpoint pentru trimiterea formularului cu upload de semnătură
router.post('/submit', formulare230Controller.uploadSignature, formulare230Controller.submitForm);

module.exports = router;
