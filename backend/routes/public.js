const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Schedule = require('../models/Schedule');

// Get all routes (public)
router.get('/routes', async (req, res) => {
  try {
    const routes = await Route.find().select('startLocation endLocation intermediateStops');
    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search / get all schedules with optional filters (public)
router.get('/schedules', async (req, res) => {
  try {
    const { from, to, date } = req.query;

    let scheduleQuery = { status: 'active' };

    const schedules = await Schedule.find(scheduleQuery)
      .populate('busId', 'busNumber totalSeats')
      .populate('routeId', 'startLocation endLocation intermediateStops')
      .sort({ departureTime: 1 });

    let filtered = schedules;

    // Filter by from location
    if (from) {
      filtered = filtered.filter(s =>
        s.routeId?.startLocation?.toLowerCase().includes(from.toLowerCase())
      );
    }

    // Filter by to location
    if (to) {
      filtered = filtered.filter(s =>
        s.routeId?.endLocation?.toLowerCase().includes(to.toLowerCase())
      );
    }

    // Filter by date
    if (date) {
      filtered = filtered.filter(s => {
        const schedDate = new Date(s.departureTime).toISOString().split('T')[0];
        return schedDate === date;
      });
    }

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single schedule by ID (public) - needed for passenger seat selection
router.get('/schedules/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('busId', 'busNumber totalSeats')
      .populate('routeId', 'startLocation endLocation intermediateStops');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Agency: get bookings for a schedule
const authenticate = require('../middleware/auth');
const role = require('../middleware/role');
const Booking = require('../models/Booking');
const Bus = require('../models/Bus');

router.get('/agency/schedules/:scheduleId/bookings', authenticate, role('agency'), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const bus = await Bus.findById(schedule.busId);
    if (!bus || bus.agencyId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const bookings = await Booking.find({
      scheduleId: req.params.scheduleId,
      status: 'confirmed'
    })
      .populate('passengerId', 'name email phone')
      .sort({ bookingTime: -1 });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
