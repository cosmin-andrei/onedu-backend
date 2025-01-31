const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

router.post('/create', blogController.createArticle);
router.get('/list', blogController.getArticles);
router.get('/paginated', blogController.getPaginatedArticles);
router.get('/:id', blogController.getArticle);
router.put('/update/:id', blogController.updateArticle);
router.delete('/delete/:id', blogController.deleteArticle);

module.exports = router;
