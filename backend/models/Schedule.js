const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: Date,
    required: true
  },
  pricePerSeat: {
    type: Number,
    required: true,
    min: 0
  },
  availableSeats: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  cancellationReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// We'll set availableSeats when creating/updating a schedule to match the bus's totalSeats initially.
// But note: we need to update availableSeats when bookings are made/cancelled.
module.exports = mongoose.model('Schedule', scheduleSchema);