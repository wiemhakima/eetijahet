// ============================================================
// SOCKET — Socket.IO manager singleton (TypeScript)
// ============================================================
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from './utils/logger';

let io: Server | null = null;

// Tracks online merchants: merchantId → agencyId
const onlineMerchants = new Map<string, string>();

// ─── Extend Socket type ──────────────────────────────────────
interface AppSocket extends Socket {
  merchantId?: string;
  merchantAgencyId?: string;
}

export function init(httpServer: HttpServer): Server {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) =>
        cb(null, !origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AppSocket;
    logger.info(`[Socket] client connected id=${socket.id}`);

    // Client joins a delivery tracking room
    socket.on('join_tracking', (code: string) => {
      if (!code) return;
      const room = `tracking:${String(code).toUpperCase()}`;
      socket.join(room);
      logger.info(`[Socket] ${socket.id} joined room ${room}`);
    });

    // Agency admin joins their room
    socket.on('join_agency', async (agencyId: string) => {
      if (!agencyId) return;
      socket.join(`agency_${agencyId}`);
      logger.info(`[Socket] Agency ${agencyId} joined (${socket.id})`);
      try {
        const Merchant = require('./models/Merchant').default;
        const docs = await Merchant.find({ agency: agencyId }).select('_id').lean();
        const agencyMerchantIds = new Set(docs.map((m: { _id: unknown }) => String(m._id)));
        const currentOnline = [...onlineMerchants.keys()].filter((id) =>
          agencyMerchantIds.has(id)
        );
        socket.emit('merchants_online_snapshot', { onlineIds: currentOnline });
      } catch (err) {
        logger.error(`[Socket] join_agency snapshot error: ${(err as Error).message}`);
      }
    });

    socket.on('agency_online', (agencyId: string) => {
      if (!agencyId) return;
      socket.join(`agency_${agencyId}`);
    });

    // Merchant joins their room
    socket.on('join_merchant', (merchantId: string) => {
      if (!merchantId) return;
      socket.join(`merchant_${merchantId}`);
    });

    socket.on('merchant_online', (merchantId: string) => {
      if (!merchantId) return;
      socket.join(`merchant_${merchantId}`);
      socket.merchantId = String(merchantId);

      const Merchant = require('./models/Merchant').default;
      Merchant.findByIdAndUpdate(
        merchantId,
        { isOnline: true, lastSeen: new Date() },
        { new: true, select: 'agency' }
      )
        .lean()
        .then((m: { agency?: unknown } | null) => {
          if (!m?.agency) return;
          const agencyId = String(m.agency);
          socket.merchantAgencyId = agencyId;
          onlineMerchants.set(socket.merchantId!, agencyId);
          emitToAgency(agencyId, 'merchant_presence', {
            merchantId: socket.merchantId,
            online: true,
          });
        })
        .catch(() => {});
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket] client disconnected id=${socket.id}`);
      if (socket.merchantId) {
        onlineMerchants.delete(socket.merchantId);
        const Merchant = require('./models/Merchant').default;
        Merchant.findByIdAndUpdate(socket.merchantId, {
          isOnline: false,
          lastSeen: new Date(),
        }).catch(() => {});
        if (socket.merchantAgencyId) {
          emitToAgency(socket.merchantAgencyId, 'merchant_presence', {
            merchantId: socket.merchantId,
            online: false,
          });
        }
      }
    });
  });

  // ── Broadcast timeout watchdog (every 30s) ────────────────
  setInterval(async () => {
    try {
      const Delivery = require('./models/Delivery').default;
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
      logger.error(`[Broadcast watchdog] ${(err as Error).message}`);
    }
  }, 30_000);

  logger.info('[Socket] Socket.IO server initialised');
  return io;
}

export const emit = (event: string, data: unknown): void => {
  io?.emit(event, data);
};

export const emitToTracking = (code: string, event: string, data: unknown): void => {
  io?.to(`tracking:${String(code).toUpperCase()}`).emit(event, data);
};

export const emitToAgency = (agencyId: string, event: string, data: unknown): void => {
  io?.to(`agency_${agencyId}`).emit(event, data);
};

export const emitToMerchant = (merchantId: string, event: string, data: unknown): void => {
  io?.to(`merchant_${merchantId}`).emit(event, data);
};

export const getIO = (): Server | null => io;

export const isMerchantOnline = (merchantId: string): boolean =>
  onlineMerchants.has(String(merchantId));

// Aliases
export const notifyAgency   = emitToAgency;
export const notifyMerchant = emitToMerchant;
