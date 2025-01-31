const express = require('express');
const router = express.Router();
const {createSponsorship} = require('../controllers/sponsorizareController');
const sponsorizareController = require('../controllers/sponsorizareController');

router.post('/', createSponsorship);
router.get('/list', sponsorizareController.getAllContracts);
router.get('/:id', sponsorizareController.getContractById);
router.get('/export/csv', sponsorizareController.exportContracts);

module.exports = router;
