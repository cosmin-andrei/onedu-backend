// routes/smartPayRoutes.js

const express = require('express');
const router = express.Router();
const smartPayController = require('../controllers/smartPayController');

// Definirea rutei pentru webhook SmartPay
router.post('/webhook', smartPayController.handleWebhook);

// Exportarea router-ului
module.exports = router;
