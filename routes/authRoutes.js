const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/request-magic-link', authController.requestMagicLink);
router.get('/validate-magic-link', authController.validateMagicLink);

module.exports = router;
