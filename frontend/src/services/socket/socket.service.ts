// ============================================================
// SOCKET SERVICE — Socket.io real-time connection
// ============================================================
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return this.socket;
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Driver events
  onNewDeliveryRequest(cb: (delivery: unknown) => void): void {
    this.socket?.on('new_delivery_request', cb);
  }

  onDeliveryUpdate(cb: (delivery: unknown) => void): void {
    this.socket?.on('delivery_update', cb);
  }

  onDriverLocationUpdate(cb: (data: { driverId: string; lat: number; lng: number }) => void): void {
    this.socket?.on('driver_location_update', cb);
  }

  onNotification(cb: (notification: unknown) => void): void {
    this.socket?.on('notification', cb);
  }

  // Emit events
  emitDriverLocation(deliveryId: string, lat: number, lng: number): void {
    this.socket?.emit('driver_location', { deliveryId, lat, lng });
  }

  emitJoinRoom(room: string): void {
    this.socket?.emit('join_room', room);
  }

  emitLeaveRoom(room: string): void {
    this.socket?.emit('leave_room', room);
  }

  off(event: string): void {
    this.socket?.off(event);
  }
}

// Singleton
export const socketService = new SocketService();
export default socketService;
