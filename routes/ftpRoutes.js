const express = require('express');
const router = express.Router();
const ftpController = require('../controllers/ftpController');
const multer = require('multer');

const upload = multer({ dest: 'temp/' });

router.get('/list', ftpController.listFiles);
router.post('/upload', upload.single('file'), ftpController.uploadFile);
router.post('/download', ftpController.downloadFile);
router.post('/delete', ftpController.deleteFile);

module.exports = router;
