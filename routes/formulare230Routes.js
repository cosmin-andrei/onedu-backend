const express = require('express');
const router = express.Router();
const formulare230Controller = require('../controllers/formulare230Controller');

router.post('/submit', formulare230Controller.uploadSignature, formulare230Controller.submitForm);
// router.get('/list', formulare230Controller.getAllFormulare);
// router.get('/:id', formulare230Controller.getFormularById);
// router.get('/export/csv', formulare230Controller.exportFormulare);

module.exports = router;
