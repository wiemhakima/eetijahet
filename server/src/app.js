
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');
const { errorHandler, notFoundHandler } = require('./api/middlewares/errorMiddleware');
const routes         = require('./api/routes');
const deliveryRoutes = require('./api/routes/deliveryRoutes');
const graphRoutes    = require('./api/routes/graphRoutes');
const webhookRoutes  = require('./api/routes/webhookRoutes');
const logger         = require('./utils/logger');

// Connect to MongoDB
mongoose.connect(config.mongodb.uri)
  .then(() => logger.info('MongoDB connected successfully'))
  .catch((err) => logger.error(`MongoDB connection error: ${err.message}`));

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

// Initialize express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Origins always allowed (dev frontend + any URL in FRONTEND_URL env var)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: function (origin, callback) {
    // No origin = server-to-server (webhooks, curl) — always allow
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // In non-production allow all; in production, only listed origins pass
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400,
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Webhook routes — no auth, no versioning
app.use('/webhook', webhookRoutes);

// Delivery routes — POST /api/route, PATCH /api/deliveries/:id/status, POST /api/deliveries/:id/complete
app.use('/api', deliveryRoutes);

// Graph proxy routes — GET /graph_info, GET /graph_status → Core Flask engine
app.use('/', graphRoutes);

// Versioned API routes
app.use(`/api/${config.apiVersion}`, routes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Express server API',
    version: config.apiVersion,
    documentation: '/api/docs'
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
