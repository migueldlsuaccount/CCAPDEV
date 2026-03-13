const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, reservationController.getReservations);
router.get('/slots', requireAuth, reservationController.getTakenSlots);
router.get('/search', requireAuth, reservationController.searchSlots);
router.post('/', requireAuth, reservationController.createReservation);
router.post('/walkin', requireAuth, reservationController.createWalkIn);
router.post('/block', requireAuth, reservationController.blockSlots);
router.patch('/:id', requireAuth, reservationController.editReservation);
router.delete('/:id', requireAuth, reservationController.deleteReservation);

module.exports = router;