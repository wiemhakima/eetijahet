require('dotenv').config();
const http          = require('http');
const mongoose      = require('mongoose');
const localtunnel   = require('localtunnel');
const app           = require('./app');
const socket        = require('./socket');
const config        = require('./config');
const logger        = require('./utils/logger');
const armadaService = require('./services/armadaService');

const server = http.createServer(app);

socket.init(server);

const runStartupSync = async () => {
  try {
    const result = await armadaService.syncOrders();
    logger.info(`Sync: fetched ${result.fetched}, saved ${result.saved}`);
  } catch (err) {
    logger.warn(`Sync skipped: ${err.message}`);
  }
};

server.listen(config.port, async () => {
  logger.info(`✅ Server running in ${config.environment} mode on port ${config.port}`);
  logger.info(`API available at http://localhost:${config.port}/api/${config.apiVersion}`);

  if (mongoose.connection.readyState === 1) {
    runStartupSync();
  } else {
    mongoose.connection.once('open', runStartupSync);
  }

  try {
    const tunnel = await localtunnel({
      port:      3000,
      subdomain: 'etijahat-webhook',
    });
    console.log('🌍 Tunnel URL:', tunnel.url + '/webhook/armada');

    tunnel.on('error', err => console.log('Tunnel error:', err));
    tunnel.on('close', ()  => console.log('Tunnel closed'));
  } catch(err) {
    console.log('Tunnel failed:', err.message);
  }
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.stack : String(reason);
  logger.error(`❌ Unhandled Promise Rejection:\n${msg}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`❌ Uncaught Exception:\n${err.stack}`);
  server.close(() => process.exit(1));
});

module.exports = server;
