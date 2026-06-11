import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../../api';
import MerchantLayout from '../MerchantLayout/MerchantLayout';
import { useAppDispatch } from '../../../store/hooks';
import { addNotification } from '../../../store/slices/notificationsSlice';

const ARMADA_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2OWU2MGU1OTA5NDM0OTg1MmU3YzFiNTkiLCJpYXQiOjE3NzY2ODQ3ODQ5MzV9.j9h-L9vO5B8LXEX5dgnYuC0EGvJbGZX5bLl7lsHI87I';
const ARMADA_BASE  = 'https://sandbox.api.armadadelivery.com';
const POLL_MS      = 30_000;

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

interface Order {
  _id:                string;
  armadaId:           string;
  status:             string;
  code:               string | null;
  customerName:       string | null;
  customerPhone:      string | null;
  destinationCity:    string | null;
  destinationAddress: string | null;
  amount:             number;
  deliveryFee:        number;
  raw:                Record<string, unknown>;
  createdAt:          string;
}

interface TrackingInfo {
  armadaOrderId: string;
  status:        string | null;
  customer:      string | null;
  driverName:    string | null;
  driverPhone:   string | null;
  eta:           string | number | null;
  distance:      string | number | null;
  trackingLink:  string | null;
}

interface ArmadaLive { statusLabel: string; color: string; rawStatus: string }

// Local DB status → display label
const STATUS_LABEL: Record<string, string> = {
  broadcasting: 'Broadcasting',
  pending:      'Pending',
  accepted:     'Accepted',
  picked_up:    'Picked up',
  in_transit:   'In transit',
  delivered:    'Delivered',
  completed:    'Delivered',
  cancelled:    'Cancelled',
};

// Armada live status → display label (French)
const ARMADA_STATUS_LABEL: Record<string, string> = {
  pending:    'En Attente',
  dispatched: 'Accepté',
  en_route:   'En route',
  in_transit: 'En route',
  delivered:  'Livrée',
  completed:  'Livrée',
  failed:     'Échouée',
  cancelled:  'Annulée',
};

// Armada live status → color
const ARMADA_COLOR: Record<string, string> = {
  pending:    '#f59e0b',
  dispatched: '#3b82f6',
  en_route:   '#8b5cf6',
  in_transit: '#8b5cf6',
  delivered:  '#16a34a',
  completed:  '#16a34a',
  failed:     '#ef4444',
  cancelled:  '#ef4444',
};

const FILTERS = ['all', 'broadcasting', 'accepted', 'in_transit', 'delivered', 'cancelled'];

const PinIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

function TrackingModal({ info, onClose }: { info: TrackingInfo; onClose: () => void }) {
  const statusColor = ARMADA_COLOR[info.status || ''] || '#64748b';
  const statusLabel = ARMADA_STATUS_LABEL[info.status || ''] || info.status || 'Unknown';

  const row = (icon: string, label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2, letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Armada Order</div>
            <code style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", background: '#dbeafe', padding: '3px 8px', borderRadius: 5 }}>
              {info.armadaOrderId}
            </code>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18, background: `${statusColor}15`, border: `1px solid ${statusColor}35`, borderRadius: 20, padding: '6px 14px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: statusColor }}>{statusLabel}</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          {info.customer   && row('👤', 'Customer', info.customer)}
          {info.driverName
            ? row('🚗', 'Driver', (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>{info.driverName}</span>
                  {info.driverPhone && <a href={`tel:${info.driverPhone}`} style={{ color: '#2563EB', fontWeight: 400, fontSize: 13 }}>📞 {info.driverPhone}</a>}
                </div>
              ))
            : row('🚗', 'Driver', <span style={{ color: '#94a3b8', fontWeight: 400 }}>Not assigned yet</span>)
          }
          {info.eta      != null && row('⏱', 'ETA',      String(info.eta))}
          {info.distance != null && row('📍', 'Distance', String(info.distance))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {info.trackingLink && (
            <a href={info.trackingLink} target="_blank" rel="noopener noreferrer"
               style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: '#16a34a', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
              🗺 Open Map
            </a>
          )}
          <button onClick={onClose}
            style={{ flex: 1, padding: '10px 0', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#374151', fontFamily: 'inherit' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const MerchantOrders: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [total,        setTotal]        = useState(0);
  const [armadaLive,   setArmadaLive]   = useState<Record<string, ArmadaLive>>({});
  const [tracking,     setTracking]     = useState<TrackingInfo | null>(null);
  const [trackLoading, setTrackLoading] = useState<string | null>(null);
  const [countdown,    setCountdown]    = useState(30);

  const intervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusesRef  = useRef<Record<string, string>>({});

  const safeOrders = Array.isArray(orders) ? orders : [];

  // Computed stats
  const totalFees      = safeOrders.reduce((s, o) => s + (o.deliveryFee || 0), 0);
  const totalProduct   = safeOrders.reduce((s, o) => s + (o.amount || 0), 0);
  const delivered      = safeOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
  const armadaFailures = safeOrders.filter(o => o.armadaId && (armadaLive[o.armadaId]?.rawStatus === 'cancelled' || armadaLive[o.armadaId]?.rawStatus === 'failed')).length;

  // Search filter
  const filtered = safeOrders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (o.code             || '').toLowerCase().includes(q) ||
      (o.customerName     || '').toLowerCase().includes(q) ||
      (o.destinationCity  || '').toLowerCase().includes(q) ||
      (o.destinationAddress || '').toLowerCase().includes(q) ||
      (o.armadaId         || '').toLowerCase().includes(q)
    );
  });

  const fetchArmadaOrder = async (armadaId: string) => {
    const res = await axios.get(`${ARMADA_BASE}/orders/${armadaId}`, { headers: { Token: ARMADA_TOKEN } });
    return res.data as Record<string, unknown>;
  };

  const retryOrder = async (armadaId: string) => {
    try {
      await axios.post(`${ARMADA_BASE}/orders/${armadaId}/retry`, {}, { headers: { Token: ARMADA_TOKEN } });
      const data = await fetchArmadaOrder(armadaId);
      const s = (data.orderStatus as string) || '';
      setArmadaLive(prev => ({ ...prev, [armadaId]: { rawStatus: s, statusLabel: ARMADA_STATUS_LABEL[s] || s || 'Unknown', color: ARMADA_COLOR[s] || '#64748b' } }));
    } catch (err) { console.error('Retry error:', err); }
  };

  const trackOrder = async (armadaId: string) => {
    setTrackLoading(armadaId);
    try {
      const data = await fetchArmadaOrder(armadaId);
      setTracking({
        armadaOrderId: armadaId,
        status:       (data.orderStatus  as string) || null,
        customer:     (data.customerName as string) || null,
        driverName:   (data.driverName   as string) || null,
        driverPhone:  (data.driverPhone  as string) || null,
        eta:          (data.eta          as string | number) ?? null,
        distance:     (data.distance     as string | number) ?? null,
        trackingLink: (data.trackingLink as string) || null,
      });
    } catch (err) { console.error('Armada track error:', err); }
    setTrackLoading(null);
  };

  const refreshLiveStatuses = async (list: Order[]) => {
    const withArmada = list.filter(o => o.armadaId);
    if (!withArmada.length) return;

    const results = await Promise.allSettled(withArmada.map(o => fetchArmadaOrder(o.armadaId)));

    // Collect status changes before updating state
    const changes: Array<{ title: string; message: string; notifType: 'error' | 'info' }> = [];

    results.forEach((r, i) => {
      if (r.status !== 'fulfilled') return;
      const curr = (r.value.orderStatus as string) || '';
      const orderId = withArmada[i]._id;
      const prev    = prevStatusesRef.current[orderId];

      if (prev !== undefined && prev !== curr && curr) {
        const isBad  = curr === 'failed' || curr === 'cancelled';
        const code   = withArmada[i].code || withArmada[i].armadaId.slice(0, 8);
        const from   = ARMADA_STATUS_LABEL[prev] || prev;
        const to     = ARMADA_STATUS_LABEL[curr] || curr;
        changes.push({
          title:      isBad ? '⚠️ Commande échouée' : '📦 Statut mis à jour',
          message:    `Commande ${code} : ${from} → ${to}`,
          notifType:  isBad ? 'error' : 'info',
        });
      }
      if (curr) prevStatusesRef.current[orderId] = curr;
    });

    setArmadaLive(prev => {
      const next = { ...prev };
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const s = (r.value.orderStatus as string) || '';
          next[withArmada[i].armadaId] = {
            rawStatus:   s,
            statusLabel: ARMADA_STATUS_LABEL[s] || s || 'Unknown',
            color:       ARMADA_COLOR[s] || '#64748b',
          };
        }
      });
      return next;
    });

    // Fire notifications after state update
    changes.forEach(c => {
      playNotificationSound();
      dispatch(addNotification({
        _id:       Date.now().toString(),
        title:     c.title,
        message:   c.message,
        type:      c.notifType,
        global:    false,
        isRead:    false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        new window.Notification(c.title, { body: c.message, icon: '/logo.png' });
      }
    });

    setCountdown(30);
  };

  const load = async (status: string) => {
    setLoading(true);
    try {
      const params = status !== 'all' ? `?status=${status}&limit=100` : '?limit=100';
      const res = await api.get(`/v1/orders${params}`);
      const raw = res.data.data;
      const list: Order[] = Array.isArray(raw) ? raw : (raw?.orders ?? []);
      setOrders(list);
      setTotal(raw?.total ?? res.data.total ?? list.length);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [filter]);

  useEffect(() => {
    if (!safeOrders.length) return;
    refreshLiveStatuses(safeOrders);
    intervalRef.current = setInterval(() => refreshLiveStatuses(safeOrders), POLL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [orders]);

  useEffect(() => {
    countdownRef.current = setInterval(() => setCountdown(c => c <= 1 ? 30 : c - 1), 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  return (
    <MerchantLayout>
      {tracking && <TrackingModal info={tracking} onClose={() => setTracking(null)} />}

      <div className="merchant-page-header">
        <div>
          <h1>My Orders</h1>
          <p>{total} order{total !== 1 ? 's' : ''} total</p>
        </div>
        <button className="merchant-btn merchant-btn--primary" onClick={() => navigate('/merchant/orders/new')}>
          + New Order
        </button>
      </div>

      {/* Stat cards */}
      <div className="merchant-stats">
        <div className="merchant-stat-card merchant-stat-card--blue">
          <div className="merchant-stat-card__bar merchant-stat-card__bar--blue" />
          <div className="merchant-stat-card__body">
            <div className="merchant-stat-card__label">Total Orders</div>
            <div className="merchant-stat-card__value">{total}</div>
            <div className="merchant-stat-card__sub">All time</div>
          </div>
        </div>

        <div className="merchant-stat-card merchant-stat-card--green">
          <div className="merchant-stat-card__bar merchant-stat-card__bar--green" />
          <div className="merchant-stat-card__body">
            <div className="merchant-stat-card__label">Delivered</div>
            <div className="merchant-stat-card__value">{delivered}</div>
            <div className="merchant-stat-card__sub">Completed orders</div>
          </div>
        </div>

        <div className="merchant-stat-card merchant-stat-card--amber">
          <div className="merchant-stat-card__bar merchant-stat-card__bar--amber" />
          <div className="merchant-stat-card__body">
            <div className="merchant-stat-card__label">Delivery Fees</div>
            <div className="merchant-stat-card__value">{totalFees.toFixed(2)}</div>
            <div className="merchant-stat-card__sub">KWD accumulated</div>
          </div>
        </div>

        <div className="merchant-stat-card merchant-stat-card--red">
          <div className="merchant-stat-card__bar merchant-stat-card__bar--red" />
          <div className="merchant-stat-card__body">
            <div className="merchant-stat-card__label">Armada Failures</div>
            <div className="merchant-stat-card__value">{armadaFailures}</div>
            <div className="merchant-stat-card__sub">Cancelled / failed</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="merchant-toolbar">
        <div className="merchant-toolbar__search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search orders, clients, destinations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter pills */}
      <div className="merchant-filters">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`merchant-pill${filter === f ? ' merchant-pill--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f] || f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="merchant-section">
        {loading ? (
          <div className="merchant-loading">
            <span className="merchant-loading__spinner" />
            Loading orders…
          </div>
        ) : filtered.length === 0 ? (
          <div className="merchant-empty">
            {search ? 'No orders match your search.' : 'No orders found.'}{' '}
            {!search && (
              <button className="merchant-btn merchant-btn--primary" style={{ marginLeft: 8 }} onClick={() => navigate('/merchant/orders/new')}>
                Create one
              </button>
            )}
          </div>
        ) : (
          <div className="merchant-table-wrap">
            <table className="merchant-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Client</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Armada</th>
                  <th>Product</th>
                  <th>Fee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const live        = armadaLive[o.armadaId] ?? null;
                  const isTracking  = trackLoading === o.armadaId;
                  const displayCode = o.code || o.armadaId;
                  const destination = [o.destinationAddress, o.destinationCity].filter(Boolean).join(', ') || '—';
                  const isFailed    = live?.rawStatus === 'failed' || live?.rawStatus === 'cancelled';

                  // Use Armada 'completed' to show as delivered in the local status column
                  const localStatus = live?.rawStatus === 'completed' ? 'delivered' : o.status;

                  return (
                    <tr key={o._id}>
                      <td><span className="merchant-order-code">{displayCode}</span></td>

                      <td>
                        <div className="merchant-customer">
                          {o.customerName || '—'}
                          {o.customerPhone && <div className="merchant-customer__phone">{o.customerPhone}</div>}
                        </div>
                      </td>

                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {destination}
                      </td>

                      <td>
                        <span className={`merchant-badge merchant-badge--${localStatus}`}>
                          {STATUS_LABEL[localStatus] || localStatus}
                        </span>
                      </td>

                      <td style={{ minWidth: 130 }}>
                        {o.armadaId ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span className="merchant-armada-code">{o.armadaId.slice(0, 12)}…</span>
                            {live ? (
                              <span style={{ fontSize: 11, fontWeight: 700, color: live.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: live.color, display: 'inline-block', flexShrink: 0 }} />
                                {live.statusLabel}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fetching…</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                        )}
                      </td>

                      <td><span className="merchant-amount">{(o.amount ?? 0).toFixed(2)} KWD</span></td>
                      <td><span className="merchant-fee">{(o.deliveryFee ?? 0).toFixed(2)} KWD</span></td>

                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {o.armadaId ? (
                            <button
                              className="merchant-track-btn"
                              disabled={isTracking}
                              onClick={() => trackOrder(o.armadaId)}
                            >
                              <PinIcon />
                              {isTracking ? '…' : 'Track'}
                            </button>
                          ) : (
                            <button
                              className="merchant-track-btn"
                              style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                              onClick={() => window.open(`/track?code=${displayCode}`, '_blank')}
                            >
                              <PinIcon />
                              Track
                            </button>
                          )}

                          {isFailed && o.armadaId && (
                            <button className="merchant-retry-btn" onClick={() => retryOrder(o.armadaId)}>
                              🔄 Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="merchant-refresh-bar">
        <span className="refresh-dot" />
        <span>Armada status auto-refreshes every 30s</span>
        <span className="refresh-countdown">{countdown}s</span>
      </div>
    </MerchantLayout>
  );
};

export default MerchantOrders;
