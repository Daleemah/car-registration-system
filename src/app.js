const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { connectDB } = require('./utils/db');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { errorLogger, requestTimer, setupUnhandledRejectionHandler } = require('./middlewares/errorLoggerMiddleware');
const { requestLogger } = require('./middlewares/requestLogger');
const expiryService = require('./services/expiryNotificationService');
const rateLimit = require('express-rate-limit');

const app = express();

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.get('/ping', (req, res) => res.send('pong'));

// Swagger UI — available at /api-docs (exempt from rate limiter)
// helmet's default CSP blocks the Swagger UI inline scripts, so we disable it for this route only
app.use('/api-docs', (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  );
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Car Registration API Docs',
  swaggerOptions: {
    persistAuthorization: true,   // keeps the token across page reloads
    displayRequestDuration: true,
    filter: true,
  },
}));

// Serve raw OpenAPI JSON (useful for Postman / code-gen imports)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// Connect Database
connectDB();

mongoose.connection.once('open', () => {
  console.log('✅ MongoDB connected successfully');
  expiryService.startCronJobs();
});

// Middlewares
app.use(requestTimer);
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
app.use('/api/expiry', require('./routes/expiryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/error-logs', require('./routes/errorLogRoutes'));
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));
app.use('/api/documents', require('./routes/documentRoutes'));


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

console.log('✅ src/app.js loaded successfully');
// console.log('Routes registered:', app._router.stack.filter(r => r.route).map(r => r.route.path));

module.exports = app;