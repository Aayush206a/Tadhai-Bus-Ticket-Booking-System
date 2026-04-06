const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startLocation: {
    type: String,
    required: true
  },
  endLocation: {
    type: String,
    required: true
  },
  intermediateStops: [{
    type: String
  }],
  distanceKm: {
    type: Number
  },
  durationHours: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);