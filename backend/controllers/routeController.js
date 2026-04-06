const Route = require('../models/Route');

// Get all routes for the logged-in agency
exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ agencyId: req.user.id });
    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new route
exports.createRoute = async (req, res) => {
  try {
    const { startLocation, endLocation, intermediateStops, distanceKm, durationHours } = req.body;

    if (!startLocation || !endLocation) {
      return res.status(400).json({ message: 'Start and end locations are required' });
    }

    // intermediateStops can be comma-separated string from frontend or array
    let stops = [];
    if (intermediateStops) {
      if (Array.isArray(intermediateStops)) {
        stops = intermediateStops.filter(s => s.trim() !== '');
      } else {
        stops = intermediateStops.split(',').map(s => s.trim()).filter(s => s !== '');
      }
    }

    const route = new Route({
      agencyId: req.user.id,
      startLocation,
      endLocation,
      intermediateStops: stops,
      distanceKm: distanceKm ? Number(distanceKm) : undefined,
      durationHours: durationHours ? Number(durationHours) : undefined
    });

    const createdRoute = await route.save();
    res.status(201).json(createdRoute);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a route
exports.updateRoute = async (req, res) => {
  try {
    const { startLocation, endLocation, intermediateStops, distanceKm, durationHours } = req.body;
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (route.agencyId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this route' });
    }

    if (startLocation) route.startLocation = startLocation;
    if (endLocation) route.endLocation = endLocation;
    if (distanceKm) route.distanceKm = Number(distanceKm);
    if (durationHours) route.durationHours = Number(durationHours);
    if (intermediateStops !== undefined) {
      if (Array.isArray(intermediateStops)) {
        route.intermediateStops = intermediateStops;
      } else {
        route.intermediateStops = intermediateStops.split(',').map(s => s.trim()).filter(s => s !== '');
      }
    }

    const updatedRoute = await route.save();
    res.json(updatedRoute);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a route
exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (route.agencyId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this route' });
    }

    await Route.deleteOne({ _id: req.params.id });
    res.json({ message: 'Route removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
