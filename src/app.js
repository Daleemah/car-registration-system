const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./utils/db.js');

const app = express();

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); 

// Connect Database
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes (you'll add more as the project grows)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));

// Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Car Registration API is running' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;