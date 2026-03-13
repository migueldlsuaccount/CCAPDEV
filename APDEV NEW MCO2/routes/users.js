const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.get('/by-email/:email', requireAuth, userController.getUserByEmail);
router.get('/:id', requireAuth, userController.getUserById);
router.get('/:id/reservations', requireAuth, userController.getUserReservations);
router.patch('/:id', requireAuth, userController.updateProfile);
router.delete('/:id', requireAuth, userController.deleteAccount);

module.exports = router;
