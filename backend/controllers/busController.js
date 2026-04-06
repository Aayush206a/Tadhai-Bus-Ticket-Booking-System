const Bus = require('../models/Bus');

// Get all buses for the logged-in agency
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ agencyId: req.user.id });
    res.json(buses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new bus
exports.createBus = async (req, res) => {
  try {
    const { busNumber, totalSeats } = req.body;

    if (!busNumber || !totalSeats) {
      return res.status(400).json({ message: 'Bus number and total seats are required' });
    }

    const busExists = await Bus.findOne({ busNumber });
    if (busExists) {
      return res.status(400).json({ message: 'Bus number already exists' });
    }

    const bus = new Bus({
      agencyId: req.user.id,
      busNumber,
      totalSeats: Number(totalSeats)
    });

    const createdBus = await bus.save();
    res.status(201).json(createdBus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a bus
exports.updateBus = async (req, res) => {
  try {
    const { busNumber, totalSeats } = req.body;
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (bus.agencyId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this bus' });
    }

    if (busNumber && busNumber !== bus.busNumber) {
      const busExists = await Bus.findOne({ busNumber });
      if (busExists) {
        return res.status(400).json({ message: 'Bus number already exists' });
      }
    }

    bus.busNumber = busNumber || bus.busNumber;
    bus.totalSeats = totalSeats || bus.totalSeats;

    const updatedBus = await bus.save();
    res.json(updatedBus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a bus
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    if (bus.agencyId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this bus' });
    }

    await Bus.deleteOne({ _id: req.params.id });
    res.json({ message: 'Bus removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
