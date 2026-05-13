const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./utils/db');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { errorLogger, requestTimer, setupUnhandledRejectionHandler } = require('./middlewares/errorLoggerMiddleware');
const { requestLogger } = require('./middlewares/requestLogger');

const app = express();

// Request timer (for duration tracking)
app.use(requestTimer);

// Connect Database
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // Optional: for console logging

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));

// Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Car Registration API is running' });
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