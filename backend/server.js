const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tadhaibusbooking')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/auth');
const busRoutes = require('./routes/buses');
const routeRoutes = require('./routes/routes');
const scheduleRoutes = require('./routes/schedules');
const bookingRoutes = require('./routes/bookings');
const publicRoutes = require('./routes/public');

app.use('/api/auth', authRoutes);
app.use('/api/agency/buses', busRoutes);
app.use('/api/agency/routes', routeRoutes);
app.use('/api/agency/schedules', scheduleRoutes);
app.use('/api/passenger/bookings', bookingRoutes);
app.use('/api/public', publicRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Tadhai Bus Booking API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
