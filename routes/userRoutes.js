// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Exemplu de rută pentru obținerea detaliilor utilizatorului
router.get('/:id', userController.getUserById);

// Exemplu de rută pentru actualizarea detaliilor utilizatorului
router.put('/:id', userController.updateUser);

// Exemplu de rută pentru ștergerea utilizatorului
router.delete('/:id', userController.deleteUser);

module.exports = router;
