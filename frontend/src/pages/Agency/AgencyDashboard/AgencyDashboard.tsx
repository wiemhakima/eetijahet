import './AgencyDashboard.scss';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useTranslation } from 'react-i18next';

import AgencyMapView from '../../../components/agency/AgencyMapView';
import RecentOrders from '../../../components/agency/RecentOrders';
import { addNotification } from '../../../store/slices/notificationsSlice';
import api from '../../../api';
// Auth state stays in Redux; all agency/delivery data now via MVC controllers
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MerchantSummary {
  _id: string;
  storeName: string;
  logo: string;
  commission: number;
  isActive: boolean;
  address?: { street?: string };
  stats: { totalOrders: number; delivered: number; totalRevenue: number; totalCommission: number };
  pendingOrders: number;
  completedOrders: number;
  user: { firstName: string; lastName: string; email: string };
}

interface Order {
  _id: string;
  code?: string;
  customerName?: string;
  customerPhone?: string;
  destinationAddress?: string;
  destinationCity?: string;
  productAmount: number;
  commissionAmount: number;
  status: string;
  driverName?: string | null;
  driverPhone?: string | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const STATUS_CFG: Record<string, { icon: string; labelKey: string; cls: string }> = {
  pending:    { icon: '⏳', labelKey: 'agency.status.pending',    cls: 'pending'    },
  dispatched: { icon: '🚚', labelKey: 'agency.status.dispatched', cls: 'accepted'   },
  en_route:   { icon: '🛵', labelKey: 'agency.status.en_route',   cls: 'in_transit' },
  delivered:  { icon: '✅', labelKey: 'agency.status.delivered',  cls: 'delivered'  },
  completed:  { icon: '✅', labelKey: 'agency.status.completed',  cls: 'delivered'  },
  cancelled:  { icon: '❌', labelKey: 'agency.status.cancelled',  cls: 'cancelled'  },
  failed:     { icon: '⚠️', labelKey: 'agency.status.failed',     cls: 'cancelled'  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const AgencyDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const { user }  = useAppSelector(s => s.auth);
  const isAdmin   = user?.role === 'agency_admin';

  const [dashTab,          setDashTab]          = useState<'overview' | 'map' | 'recent'>('overview');
  const [merchants,        setMerchants]        = useState<MerchantSummary[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantSummary | null>(null);
  const [orders,           setOrders]           = useState<Order[]>([]);
  const [activeTab,        setActiveTab]         = useState<'pending' | 'completed'>('pending');
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [loadingOrders,    setLoadingOrders]    = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return t('agency.timeAgo.justNow');
    if (mins < 60) return t('agency.timeAgo.minutesAgo', { count: mins });
    const h = Math.floor(mins / 60);
    if (h < 24) return t('agency.timeAgo.hoursAgo', { count: h });
    return new Date(date).toLocaleDateString();
  };

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchMerchants = useCallback(async () => {
    try {
      const res = await api.get('/v1/agencies/me/merchants/with-stats');
      const rawM = res.data.data;
      const list: MerchantSummary[] = Array.isArray(rawM) ? rawM : (rawM?.data ?? rawM?.merchants ?? []);
      setMerchants(list);
      setSelectedMerchant(prev =>
        prev
          ? (list.find((m: MerchantSummary) => m._id === prev._id) ?? list[0] ?? null)
          : (list[0] ?? null)
      );
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: unknown } };
      console.error('[AgencyDashboard] merchants load failed — status:', err?.response?.status, 'data:', err?.response?.data);
    } finally {
      setLoadingMerchants(false);
    }
  }, []);

  const fetchOrders = useCallback(async (merchantId: string, tab: 'pending' | 'completed') => {
    setLoadingOrders(true);
    try {
      const res = await api.get(`/v1/agencies/me/merchants/${merchantId}/orders?status=${tab}`);
      const rawO = res.data.data;
      setOrders(Array.isArray(rawO) ? rawO : (rawO?.data ?? rawO?.orders ?? []) as Order[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // ── Socket.IO ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const skt = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = skt;

    skt.on('connect', () => {
      if (user?.agency) skt.emit('agency_online', String(user.agency));
    });

    skt.on('new_order', (data: Record<string, unknown> = {}) => {
      fetchMerchants();
      dispatch(addNotification({
        _id:       Date.now().toString(),
        title:     (data.title   as string) || t('agency.dashboard.newOrderReceived'),
        message:   (data.message as string) || '',
        type:      'info',
        global:    false,
        isRead:    false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    });

    skt.on('order_status_update', (data: Record<string, unknown> = {}) => {
      fetchMerchants();
      dispatch(addNotification({
        _id:       Date.now().toString(),
        title:     (data.title   as string) || t('agency.dashboard.statusUpdated'),
        message:   (data.message as string) || '',
        type:      'success',
        global:    false,
        isRead:    false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    });

    skt.on('delivery_status_update', (data: { merchantId: string; status: string; driverName: string; deliveryId: string }) => {
      setOrders(prev =>
        prev.map(o =>
          o._id === String(data.deliveryId)
            ? { ...o, status: data.status, driverName: data.driverName || o.driverName }
            : o,
        ),
      );
      fetchMerchants();
    });

    skt.on('delivery_accepted', (data: { merchantId?: string }) => {
      if (data.merchantId && selectedMerchant?._id === data.merchantId) {
        fetchOrders(data.merchantId, activeTab);
      }
    });

    return () => { skt.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.agency, dispatch]);

  // ── Load initial data ──────────────────────────────────────────────────────

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  useEffect(() => {
    if (selectedMerchant) fetchOrders(selectedMerchant._id, activeTab);
  }, [selectedMerchant?._id, activeTab, fetchOrders]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const safeMerchants = Array.isArray(merchants) ? merchants : [];
  const safeOrders    = Array.isArray(orders)    ? orders    : [];
  const sel = selectedMerchant;

  return (
    <div className="agency-dashboard">

      {/* Header */}
      <div className="ag-page-header">
        <div>
          <h1>{t('agency.dashboard.title')}</h1>
          <p>{t('agency.dashboard.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="ag-btn ag-btn--outline" onClick={() => navigate('/agency/deliveries')}>
            {t('agency.dashboard.allDeliveries')}
          </button>
        </div>
      </div>

      {/* ── Dashboard tabs ── */}
      <div className="ag-tabs" style={{ marginBottom: 0, borderBottom: '2px solid #f1f5f9' }}>
        {([
          { key: 'overview', labelKey: 'agency.dashboard.tabOverview' },
          { key: 'map',      labelKey: 'agency.dashboard.tabMap'      },
          { key: 'recent',   labelKey: 'agency.dashboard.tabRecent'   },
        ] as const).map(tab => (
          <button
            key={tab.key}
            className={`ag-tab${dashTab === tab.key ? ' ag-tab--active' : ''}`}
            onClick={() => setDashTab(tab.key)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* ── Live Map tab ── */}
      {dashTab === 'map' && (
        <div className="ag-section" style={{ padding: '20px 24px' }}>
          <AgencyMapView />
        </div>
      )}

      {/* ── Recent Orders tab ── */}
      {dashTab === 'recent' && (
        <div className="ag-section" style={{ padding: '20px 24px' }}>
          <RecentOrders />
        </div>
      )}

      {/* ── Overview tab — Merchants grid ── */}
      {dashTab === 'overview' && <div className="ag-section" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <strong style={{ fontSize: 15 }}>{t('agency.dashboard.myMerchants')}</strong>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{t('agency.dashboard.liveUpdates')}</span>
        </div>

        {loadingMerchants ? (
          <p className="ag-empty">{t('agency.dashboard.loadingMerchants')}</p>
        ) : safeMerchants.length === 0 ? (
          <p className="ag-empty">
            {t('agency.dashboard.noMerchants')}{' '}
            {isAdmin && (
              <button className="ag-btn ag-btn--primary" style={{ marginLeft: 8 }} onClick={() => navigate('/agency/merchants')}>
                {t('agency.dashboard.addFirstMerchant')}
              </button>
            )}
          </p>
        ) : (
          <div className="ag-merchant-grid">
            {safeMerchants.map(m => (
              <div
                key={m._id}
                className={`ag-merchant-card${sel?._id === m._id ? ' ag-merchant-card--selected' : ''}`}
                onClick={() => setSelectedMerchant(m)}
              >
                <div className="ag-merchant-card__logo">
                  {m.logo
                    ? <img src={m.logo} alt={m.storeName} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <span>🏪</span>}
                </div>
                <div className="ag-merchant-card__name">{m.storeName}</div>
                <div className="ag-merchant-card__comm">{m.commission}% {t('agency.dashboard.commission')}</div>
                <div className="ag-merchant-card__counts">
                  {m.pendingOrders > 0 && (
                    <span className="ag-merchant-card__count ag-merchant-card__count--pending">
                      {m.pendingOrders} {t('agency.dashboard.active')}
                    </span>
                  )}
                  <span className="ag-merchant-card__count ag-merchant-card__count--done">
                    {m.stats?.delivered || 0} {t('agency.dashboard.delivered')}
                  </span>
                  <span className="ag-merchant-card__count">
                    {m.stats?.totalOrders || 0} {t('agency.dashboard.total')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* Selected merchant orders — overview tab only */}
      {dashTab === 'overview' && sel && (
        <div className="ag-section" style={{ overflow: 'hidden' }}>
          {/* Merchant header bar */}
          <div className="ag-merchant-header">
            <div className="ag-merchant-header__logo">
              {sel.logo
                ? <img src={sel.logo} alt={sel.storeName} />
                : <span>🏪</span>}
            </div>
            <div>
              <h3 className="ag-merchant-header__name">{sel.storeName}</h3>
              <p className="ag-merchant-header__sub">
                {sel.stats?.delivered || 0} {t('agency.dashboard.delivered')} &nbsp;·&nbsp;
                {(sel.stats?.totalOrders || 0) - (sel.stats?.delivered || 0)} {t('agency.dashboard.active')} &nbsp;·&nbsp;
                {sel.commission}% {t('agency.dashboard.commission')}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="ag-tabs">
            <button
              className={`ag-tab${activeTab === 'pending' ? ' ag-tab--active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              {t('agency.dashboard.activeOrders')} ({sel.pendingOrders})
            </button>
            <button
              className={`ag-tab${activeTab === 'completed' ? ' ag-tab--active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              {t('agency.dashboard.historyOrders')} ({sel.stats?.delivered || 0})
            </button>
          </div>

          {/* Order list */}
          <div className="ag-orders-list">
            {loadingOrders ? (
              <div className="ag-empty">{t('agency.dashboard.loadingOrders')}</div>
            ) : safeOrders.length === 0 ? (
              <div className="ag-empty">
                {activeTab === 'pending' ? t('agency.dashboard.noActiveOrders') : t('agency.dashboard.noCompletedOrders')}
              </div>
            ) : (
              safeOrders.map(o => {
                const cfg = STATUS_CFG[o.status] ?? { icon: '❓', labelKey: '', cls: 'default' };
                const label = cfg.labelKey ? t(cfg.labelKey) : o.status;
                const destination = [o.destinationAddress, o.destinationCity].filter(Boolean).join(', ');
                return (
                  <div key={o._id} className="ag-order-row">
                    <div className={`ag-order-row__icon ag-order-row__icon--${cfg.cls}`}>
                      {cfg.icon}
                    </div>
                    <div className="ag-order-row__info">
                      <div className="ag-order-row__title">
                        <code>{o.code || '—'}</code>
                        {o.customerName && <span> — {o.customerName}</span>}
                        {o.customerPhone && <span style={{ color: '#94a3b8', fontSize: 12 }}> · {o.customerPhone}</span>}
                      </div>
                      <div className="ag-order-row__sub">
                        {destination && <span>📍 {destination}</span>}
                        {o.productAmount > 0 && <span> · {o.productAmount.toFixed(2)} KWD</span>}
                        {o.driverName && (
                          <span style={{ color: '#3b82f6' }}>
                            {' '}· 🚚 {o.driverName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ag-order-row__right">
                      <span className={`ag-badge ag-badge--${cfg.cls}`}>{cfg.icon} {label}</span>
                      <div className="ag-order-row__time">{timeAgo(o.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyDashboard;
