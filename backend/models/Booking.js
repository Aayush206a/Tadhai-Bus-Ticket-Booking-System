const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  seatNumber: {
    type: Number,
    required: true
  },
  bookingTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'confirmed'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'refunded'],
    default: 'paid'
  },
  cancellationReason: {
    type: String,
    default: null
  },
  cancelledBy: {
    type: String,
    enum: ['passenger', 'agency',null],
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);