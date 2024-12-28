// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Endpoint pentru solicitarea link-ului magic
router.post('/request-magic-link', authController.requestMagicLink);

// Endpoint pentru validarea link-ului magic
router.get('/validate-magic-link', authController.validateMagicLink);

module.exports = router;
