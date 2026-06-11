// ============================================================
// APP — Express application setup (TypeScript)
// ============================================================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config';
import { errorHandler, notFoundHandler } from './api/middlewares/errorMiddleware';
import logger from './utils/logger';

// Routes (will be converted to TS progressively)
import routes         from './api/routes';
import deliveryRoutes from './api/routes/deliveryRoutes';
import graphRoutes    from './api/routes/graphRoutes';
import webhookRoutes  from './api/routes/webhookRoutes';

// ─── MongoDB connection ──────────────────────────────────────
mongoose
  .connect(config.mongodb.uri)
  .then(() => logger.info('✅ MongoDB connected successfully'))
  .catch((err: Error) => logger.error(`MongoDB connection error: ${err.message}`));

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => logger.info('MongoDB reconnected'));
mongoose.connection.on('error', (err: Error) => logger.error(`MongoDB error: ${err.message}`));

// ─── Express app ─────────────────────────────────────────────
const app = express();

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      if (config.environment !== 'production') return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  })
);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────
// Webhooks — no auth, no versioning
app.use('/webhook', webhookRoutes);

// Delivery routes
app.use('/api', deliveryRoutes);

// Graph proxy routes → Core Flask engine
app.use('/', graphRoutes);

// Versioned API routes
app.use(`/api/${config.apiVersion}`, routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: config.apiVersion, environment: config.environment });
});

// ─── Error handlers ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
