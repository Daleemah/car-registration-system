const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./utils/db');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { errorLogger, requestTimer, setupUnhandledRejectionHandler } = require('./middlewares/errorLoggerMiddleware');
const { requestLogger } = require('./middlewares/requestLogger');
const expiryService = require('./services/expiryNotificationService');
const rateLimit = require('express-rate-limit');

const app = express();

// Request timer (for duration tracking)
app.use(requestTimer);
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// Connect Database
connectDB();

mongoose.connection.once('open', () => {
  console.log('✅ MongoDB connected successfully');
  expiryService.startCronJobs();
});

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));


// app.use('/api/expiry', require('./routes/expiryRoutes')); // ✅ Add expiry routes


// Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Car Registration API is running',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Health check for monitoring services
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use(notFound);

// Error Logger (logs to database)
app.use(errorLogger);

// Error Handler (sends response)
app.use(errorHandler);

// Setup unhandled rejection handler
setupUnhandledRejectionHandler();

module.exports = app;