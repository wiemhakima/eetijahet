/**
 * Socket.IO manager — singleton pattern
 */
const { Server } = require('socket.io');
const logger = require('./utils/logger');

let io = null;

// Tracks which merchants are currently connected: merchantId → agencyId
const onlineMerchants = new Map();

function init(httpServer) {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => cb(null, allowedOrigins.includes(origin) || !origin || process.env.NODE_ENV !== 'production'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket] client connected   id=${socket.id}`);

    // Client joins a tracking room to receive live updates for a specific delivery
    socket.on('join_tracking', (code) => {
      if (!code) return;
      const room = `tracking:${String(code).toUpperCase()}`;
      socket.join(room);
      logger.info(`[Socket] ${socket.id} joined room ${room}`);
    });

    // Agency admin joins their agency room — send a snapshot of currently-online merchants
    socket.on('join_agency', async (agencyId) => {
      if (!agencyId) return;
      socket.join(`agency_${agencyId}`);
      logger.info(`[Socket] Agency ${agencyId} joined (${socket.id})`);
      try {
        const Merchant = require('./models/Merchant');
        const docs = await Merchant.find({ agency: agencyId }).select('_id').lean();
        const agencyMerchantIds = new Set(docs.map(m => String(m._id)));
        const currentOnline = [...onlineMerchants.keys()].filter(id => agencyMerchantIds.has(id));
        socket.emit('merchants_online_snapshot', { onlineIds: currentOnline });
      } catch (err) {
        logger.error(`[Socket] join_agency snapshot error: ${err.message}`);
      }
    });
    socket.on('agency_online', (agencyId) => {
      if (!agencyId) return;
      socket.join(`agency_${agencyId}`);
      logger.info(`[Socket] Agency ${agencyId} online/legacy (${socket.id})`);
    });

    // Merchant joins their room and signals presence to their agency
    socket.on('join_merchant', (merchantId) => {
      if (!merchantId) return;
      socket.join(`merchant_${merchantId}`);
      logger.info(`[Socket] Merchant ${merchantId} joined (${socket.id})`);
    });
    socket.on('merchant_online', (merchantId) => {
      if (!merchantId) return;
      socket.join(`merchant_${merchantId}`);
      socket.merchantId = String(merchantId);

      const Merchant = require('./models/Merchant');
      Merchant.findByIdAndUpdate(
        merchantId,
        { isOnline: true, lastSeen: new Date() },
        { new: true, select: 'agency' },
      ).lean().then(m => {
        if (!m?.agency) return;
        const agencyId = String(m.agency);
        socket.merchantAgencyId = agencyId;
        onlineMerchants.set(socket.merchantId, agencyId);
        emitToAgency(agencyId, 'merchant_presence', { merchantId: socket.merchantId, online: true });
        logger.info(`[Socket] Merchant ${merchantId} online → agency ${agencyId}`);
      }).catch(() => {});
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket] client disconnected id=${socket.id}`);
      if (socket.merchantId) {
        onlineMerchants.delete(socket.merchantId);
        const Merchant = require('./models/Merchant');
        Merchant.findByIdAndUpdate(socket.merchantId, { isOnline: false, lastSeen: new Date() }).catch(() => {});
        if (socket.merchantAgencyId) {
          emitToAgency(socket.merchantAgencyId, 'merchant_presence', {
            merchantId: socket.merchantId,
            online: false,
          });
          logger.info(`[Socket] Merchant ${socket.merchantId} offline → agency ${socket.merchantAgencyId}`);
        }
      }
    });
  });

  // ── Broadcast timeout watchdog (every 30s) ─────────────────────────────────
  // Moves expired broadcasting deliveries to 'pending' so the agency can
  // assign a driver manually.
  setInterval(async () => {
    try {
      const Delivery = require('./models/Delivery');
      const expired = await Delivery.find({
        clientStatus: 'broadcasting',
        broadcastExpiresAt: { $lt: new Date() },
      }).select('_id agency');

      for (const d of expired) {
        d.clientStatus = 'pending';
        await d.save();
        emitToAgency(String(d.agency), 'delivery_no_response', {
          deliveryId: d._id,
          message: 'No driver accepted within the timeout. Assign manually.',
        });
        logger.info(`[Broadcast] Delivery ${d._id} expired → pending`);
      }
    } catch (err) {
      logger.error(`[Broadcast watchdog] ${err.message}`);
    }
  }, 30_000);

  logger.info('[Socket] Socket.IO server initialised');
  return io;
}

/** Broadcast an event to every connected client. */
function emit(event, data) {
  if (!io) return;
  io.emit(event, data);
}

/** Emit to all clients watching a specific tracking code. */
function emitToTracking(code, event, data) {
  if (!io || !code) return;
  io.to(`tracking:${String(code).toUpperCase()}`).emit(event, data);
}

/** Emit to a specific agency's socket room. */
function emitToAgency(agencyId, event, data) {
  if (!io || !agencyId) return;
  io.to(`agency_${agencyId}`).emit(event, data);
}

/** Emit to a specific merchant's socket room. */
function emitToMerchant(merchantId, event, data) {
  if (!io || !merchantId) return;
  io.to(`merchant_${merchantId}`).emit(event, data);
}

/** Return the raw io instance (for advanced use). */
function getIO() {
  return io;
}

/** Alias used by service/controller layer for new-order and status notifications. */
const notifyAgency   = emitToAgency;
const notifyMerchant = emitToMerchant;

/** Returns true if the merchant currently has an active socket connection. */
function isMerchantOnline(merchantId) {
  return onlineMerchants.has(String(merchantId));
}

module.exports = { init, emit, emitToTracking, emitToAgency, emitToMerchant, notifyAgency, notifyMerchant, getIO, isMerchantOnline };
