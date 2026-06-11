// ============================================================
// SERVER — HTTP server entry point (TypeScript)
// ============================================================
import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import * as socket from './socket';
import config from './config';
import logger from './utils/logger';

const server = http.createServer(app);

// Initialize Socket.IO
socket.init(server);

// Startup sync (Armada orders)
const runStartupSync = async (): Promise<void> => {
  try {
    const { default: armadaService } = await import('./services/armadaService');
    const result = await armadaService.syncOrders();
    logger.info(`Sync: fetched ${result.fetched}, saved ${result.saved}`);
  } catch (err) {
    logger.warn(`Sync skipped: ${(err as Error).message}`);
  }
};

// Start server
server.listen(config.port, async () => {
  logger.info(`✅ Server running in ${config.environment} mode on port ${config.port}`);
  logger.info(`API available at http://localhost:${config.port}/api/${config.apiVersion}`);

  if (mongoose.connection.readyState === 1) {
    runStartupSync();
  } else {
    mongoose.connection.once('open', runStartupSync);
  }

  // Localtunnel for webhook (dev only)
  if (config.environment !== 'production') {
    try {
      const { default: localtunnel } = await import('localtunnel');
      const tunnel = await localtunnel({ port: config.port, subdomain: 'etijahat-webhook' });
      logger.info(`🌍 Tunnel URL: ${tunnel.url}/webhook/armada`);
      tunnel.on('error', (err: Error) => logger.warn(`Tunnel error: ${err.message}`));
      tunnel.on('close', () => logger.warn('Tunnel closed'));
    } catch (err) {
      logger.warn(`Tunnel failed: ${(err as Error).message}`);
    }
  }
});

// ─── Process error handlers ──────────────────────────────────
process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.stack : String(reason);
  logger.error(`❌ Unhandled Promise Rejection:\n${msg}`);
});

process.on('uncaughtException', (err: Error) => {
  logger.error(`❌ Uncaught Exception:\n${err.stack}`);
  server.close(() => process.exit(1));
});

export default server;
