const express = require('express');
const router = express.Router();
const smartPayController = require('../controllers/smartPayController');

router.post('/webhook', smartPayController.handleWebhook);

module.exports = router;
