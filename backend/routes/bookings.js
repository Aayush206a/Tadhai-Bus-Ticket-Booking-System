const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authenticate = require('../middleware/auth');
const role = require('../middleware/role');

// Passenger routes (all require passenger role)
router.post('/', authenticate, role('passenger'), bookingController.createBooking);
router.get('/', authenticate, role('passenger'), bookingController.getMyBookings);

// Seat map for a schedule (passenger)
router.get('/schedule/:scheduleId/seats', authenticate, role('passenger'), bookingController.getScheduleSeats);

// Individual booking by ID (passenger)
router.get('/:id', authenticate, role('passenger'), bookingController.getBookingById);
router.put('/:id/cancel', authenticate, role('passenger'), bookingController.cancelBooking);

module.exports = router;
