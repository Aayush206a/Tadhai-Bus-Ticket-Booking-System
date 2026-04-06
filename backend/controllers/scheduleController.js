const Schedule = require('../models/Schedule');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

// Get all schedules for the logged-in agency
exports.getSchedules = async (req, res) => {
  try {
    const buses = await Bus.find({ agencyId: req.user.id }).select('_id');
    const busIds = buses.map(bus => bus._id);

    const schedules = await Schedule.find({ busId: { $in: busIds } })
      .populate('busId', 'busNumber totalSeats')
      .populate('routeId', 'startLocation endLocation intermediateStops');

    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new schedule
exports.createSchedule = async (req, res) => {
  try {
    const { busId, routeId, departureTime, arrivalTime, pricePerSeat } = req.body;

    if (!busId || !routeId || !departureTime || !arrivalTime || !pricePerSeat) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    if (bus.agencyId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to use this bus' });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    if (route.agencyId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to use this route' });
    }

    if (new Date(departureTime) >= new Date(arrivalTime)) {
      return res.status(400).json({ message: 'Arrival time must be after departure time' });
    }

    const schedule = new Schedule({
      busId,
      routeId,
      departureTime,
      arrivalTime,
      pricePerSeat: Number(pricePerSeat),
      availableSeats: bus.totalSeats
    });

    const createdSchedule = await schedule.save();
    await createdSchedule.populate('busId', 'busNumber totalSeats');
    await createdSchedule.populate('routeId', 'startLocation endLocation');

    res.status(201).json(createdSchedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { busId, routeId, departureTime, arrivalTime, pricePerSeat, availableSeats, status, cancellationReason } = req.body;

    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const bus = await Bus.findById(schedule.busId);
    if (!bus || bus.agencyId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this schedule' });
    }

    if (busId && busId.toString() !== schedule.busId.toString()) {
      const newBus = await Bus.findById(busId);
      if (!newBus) return res.status(404).json({ message: 'New bus not found' });
      if (newBus.agencyId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Not authorized to use this bus' });
      }
      if (!availableSeats) schedule.availableSeats = newBus.totalSeats;
      schedule.busId = busId;
    }

    if (routeId && routeId.toString() !== schedule.routeId.toString()) {
      const newRoute = await Route.findById(routeId);
      if (!newRoute) return res.status(404).json({ message: 'New route not found' });
      if (newRoute.agencyId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Not authorized to use this route' });
      }
      schedule.routeId = routeId;
    }

    if (departureTime !== undefined) schedule.departureTime = departureTime;
    if (arrivalTime !== undefined) schedule.arrivalTime = arrivalTime;
    if (pricePerSeat !== undefined) schedule.pricePerSeat = Number(pricePerSeat);
    if (availableSeats !== undefined) schedule.availableSeats = Number(availableSeats);
    if (status !== undefined) schedule.status = status;
    if (cancellationReason !== undefined) schedule.cancellationReason = cancellationReason;

    const updatedSchedule = await schedule.save();
    await updatedSchedule.populate('busId', 'busNumber totalSeats');
    await updatedSchedule.populate('routeId', 'startLocation endLocation');

    res.json(updatedSchedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a schedule — requires a reason, auto-cancels all passenger bookings
exports.deleteSchedule = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'A reason is required to remove a schedule' });
    }

    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const bus = await Bus.findById(schedule.busId);
    if (!bus || bus.agencyId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this schedule' });
    }

    // Auto-cancel all confirmed bookings for this schedule with the reason
    const Booking = require('../models/Booking');
    await Booking.updateMany(
      { scheduleId: req.params.id, status: 'confirmed' },
      {
        status: 'cancelled',
        cancellationReason: reason.trim(),
        cancelledBy: 'agency'
      }
    );

    await Schedule.deleteOne({ _id: req.params.id });
    res.json({ message: 'Schedule removed and all bookings cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get schedule by ID (public)
exports.getScheduleById = async (req, res) => {
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
};
