const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  busNumber: {
    type: String,
    required: true,
    unique: true
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bus', busSchema);