const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const Bus = require('../models/Bus');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { scheduleId, seatNumber } = req.body;

    if (!scheduleId || !seatNumber) {
      return res.status(400).json({ message: 'Schedule ID and seat number are required' });
    }

    const schedule = await Schedule.findById(scheduleId).populate('busId', 'totalSeats');
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    if (schedule.status !== 'active') {
      return res.status(400).json({ message: 'This schedule is not active' });
    }

    const totalSeats = schedule.busId.totalSeats;
    if (seatNumber < 1 || seatNumber > totalSeats) {
      return res.status(400).json({ message: `Invalid seat number. Must be between 1 and ${totalSeats}` });
    }

    const existingBooking = await Booking.findOne({
      scheduleId,
      seatNumber: Number(seatNumber),
      status: 'confirmed'
    });
    if (existingBooking) {
      return res.status(400).json({ message: 'This seat is already booked' });
    }

    if (schedule.availableSeats < 1) {
      return res.status(400).json({ message: 'No seats available on this schedule' });
    }

    const booking = new Booking({
      passengerId: req.user.id,
      scheduleId,
      seatNumber: Number(seatNumber)
    });

    const createdBooking = await booking.save();

    // Decrement available seats
    schedule.availableSeats -= 1;
    await schedule.save();

    await createdBooking.populate({
      path: 'scheduleId',
      populate: [
        { path: 'busId', select: 'busNumber' },
        { path: 'routeId', select: 'startLocation endLocation' }
      ]
    });

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all bookings for the logged-in passenger
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ passengerId: req.user.id })
      .populate({
        path: 'scheduleId',
        populate: [
          { path: 'busId', select: 'busNumber' },
          { path: 'routeId', select: 'startLocation endLocation intermediateStops' }
        ]
      })
      .sort({ bookingTime: -1 });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'scheduleId',
        populate: [
          { path: 'busId', select: 'busNumber totalSeats' },
          { path: 'routeId', select: 'startLocation endLocation intermediateStops' }
        ]
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.passengerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.passengerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = 'passenger';
    booking.cancellationReason = 'Cancelled by passenger';
    await booking.save();

    // Restore available seat
    const schedule = await Schedule.findById(booking.scheduleId);
    if (schedule) {
      schedule.availableSeats += 1;
      await schedule.save();
    }

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get seat map for a schedule (passenger use)
exports.getScheduleSeats = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.scheduleId)
      .populate('busId', 'totalSeats');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const bookings = await Booking.find({
      scheduleId: req.params.scheduleId,
      status: 'confirmed'
    }).select('seatNumber');

    const bookedSeats = bookings.map(b => b.seatNumber);
    const totalSeats = schedule.busId.totalSeats;

    res.json({ bookedSeats, totalSeats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bookings for a schedule (agency use)
exports.getScheduleBookings = async (req, res) => {
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
};
