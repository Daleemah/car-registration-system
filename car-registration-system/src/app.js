require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const documentRoutes = require('./routes/documentRoutes');
app.use('/documents', documentRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Car Registration API is running 🚗');
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err);
  });

module.exports = app;0

