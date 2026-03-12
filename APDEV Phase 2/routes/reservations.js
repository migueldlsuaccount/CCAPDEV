const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, reservationController.getReservations);
router.get('/slots', requireAuth, reservationController.getTakenSlots);
router.post('/', requireAuth, reservationController.createReservation);
router.post('/walkin', requireAuth, reservationController.createWalkIn);
router.patch('/:id', requireAuth, reservationController.editReservation);
router.delete('/:id', requireAuth, reservationController.deleteReservation);

module.exports = router;
