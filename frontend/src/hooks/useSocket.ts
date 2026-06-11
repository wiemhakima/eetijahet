import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from '../store/hooks';
import { addNotification, type Notification as AppNotification } from '../store/slices/notificationsSlice';
import { setMerchantOnline, setMerchantsSnapshot } from '../store/slices/agencySlice';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:3000';

function playNotificationSound() {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

function toNotification(data: Record<string, unknown>): AppNotification {
  return {
    _id:       Date.now().toString(),
    title:     (data.title   as string) || 'Notification',
    message:   (data.message as string) || '',
    type:      'info',
    global:    false,
    isRead:    false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useAgencySocket(agencyId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const dispatch  = useAppDispatch();

  useEffect(() => {
    if (!agencyId) return;

    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('join_agency',  agencyId);
      s.emit('agency_online', agencyId); // backward compat with existing rooms
    });

    const handle = (data: Record<string, unknown>) => {
      if (data.sound) playNotificationSound();
      dispatch(addNotification(toNotification(data)));
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(toNotification(data).title, { body: toNotification(data).message });
      }
    };

    s.on('new_order',           handle);
    s.on('order_status_update', handle);

    s.on('order_failed', (data: Record<string, unknown>) => {
      playNotificationSound();
      playNotificationSound();
      dispatch(addNotification(toNotification(data)));
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification((data.title as string) || '⚠️ Commande échouée', {
          body: (data.message as string) || '',
          icon: '/logo.png',
        });
      }
    });

    s.on('merchant_presence', (data: { merchantId: string; online: boolean }) => {
      dispatch(setMerchantOnline(data));
    });

    s.on('merchants_online_snapshot', (data: { onlineIds: string[] }) => {
      dispatch(setMerchantsSnapshot(data.onlineIds));
    });

    // Re-request snapshot every 30s as a fallback for any missed presence events
    const poll = setInterval(() => {
      if (s.connected) s.emit('join_agency', agencyId);
    }, 30_000);

    return () => { clearInterval(poll); s.disconnect(); socketRef.current = null; };
  }, [agencyId, dispatch]);
}

export function useMerchantSocket(merchantId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const dispatch  = useAppDispatch();

  useEffect(() => {
    if (!merchantId) return;

    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.emit('merchant_online', merchantId);
    s.on('connect', () => {
      s.emit('join_merchant',   merchantId);
      s.emit('merchant_online', merchantId);
    });

    s.on('order_status_update', (data: Record<string, unknown>) => {
      if (data.sound) playNotificationSound();
      dispatch(addNotification(toNotification(data)));
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(toNotification(data).title, { body: toNotification(data).message });
      }
    });

    s.on('order_failed', (data: Record<string, unknown>) => {
      playNotificationSound();
      playNotificationSound();
      dispatch(addNotification(toNotification(data)));
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification((data.title as string) || '⚠️ Votre commande a échoué', {
          body: (data.message as string) || '',
          icon: '/logo.png',
        });
      }
    });

    return () => { s.disconnect(); socketRef.current = null; };
  }, [merchantId, dispatch]);
}
