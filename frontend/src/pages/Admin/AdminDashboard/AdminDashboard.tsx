import './AdminDashboard.scss';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import React, { useEffect, useMemo, useState } from 'react';
import { useAdminUsersController } from '../../../controllers/useAdminUsersController';

import { t18n } from '../../../utils/i18nString';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// ── Icons ──────────────────────────────────────────────────────────────────

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
  </svg>
);
const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
    <polyline points="17,6 23,6 23,12" />
  </svg>
);
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><polyline points="12,5 19,12 12,19" />
  </svg>
);
const BroadcastIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

// ── Static color maps ──────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  Free:       '#687078',
  Basic:      '#0972d3',
  Premium:    '#037f0c',
  Enterprise: '#d97706',
};

const NOTIF_COLORS: Record<string, string> = {
  success: '#037f0c',
  error:   '#d13212',
  warning: '#d97706',
  info:    '#0972d3',
};

const getInitials = (first: string, last: string) =>
  `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

// ── Component ──────────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const navigate  = useNavigate();
  const ctrl      = useAdminUsersController();
  const { t, i18n } = useTranslation();
  const { stats, users: rawUsers, notifications: rawNotifications, isLoading } = ctrl;
  const users         = Array.isArray(rawUsers)         ? rawUsers         : [];
  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];

  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'info' });
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [isSending, setIsSending]         = useState(false);

  useEffect(() => {
    ctrl.loadStats();
    ctrl.loadUsers({ page: 1, limit: 6, role: 'developer' });
    ctrl.loadNotifications({ page: 1, limit: 6, userRole: 'developer' });
  }, []);

  const weekData = useMemo(() => [
    { day: t('dashboard.admin.dayMon'), requests: 8247 },
    { day: t('dashboard.admin.dayTue'), requests: 9812 },
    { day: t('dashboard.admin.dayWed'), requests: 11054 },
    { day: t('dashboard.admin.dayThu'), requests: 10503 },
    { day: t('dashboard.admin.dayFri'), requests: 13120 },
    { day: t('dashboard.admin.daySat'), requests: 9301 },
    { day: t('dashboard.admin.daySun'), requests: 12400 },
  ], [t]);

  const formatDate = (dateStr: string) => {
    const locale = i18n.language === 'ar' ? 'ar' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const timeAgo = (dateStr: string) => {
    const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (m < 1) return t('dashboard.admin.justNow');
    if (m < 60) return t('dashboard.admin.minutesAgo', { m });
    const h = Math.floor(m / 60);
    if (h < 24) return t('dashboard.admin.hoursAgo', { h });
    return t('dashboard.admin.daysAgo', { d: Math.floor(h / 24) });
  };

  const tierChartData = stats?.tiers
    ? Object.entries(stats.tiers).map(([key, val]) => {
        const name = key.charAt(0).toUpperCase() + key.slice(1);
        return { name, value: val, color: TIER_COLORS[name] || '#687078' };
      })
    : [];

  const handleBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return;
    setIsSending(true);
    await ctrl.broadcastNotification({
      title:   broadcastForm.title,
      message: broadcastForm.message,
      type:    broadcastForm.type as 'info' | 'success' | 'warning' | 'error',
    });
    setIsSending(false);
    setBroadcastForm({ title: '', message: '', type: 'info' });
    setShowBroadcast(false);
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
  };

  const statCards = [
    {
      label:     t('dashboard.admin.registeredDevs'),
      value:     stats ? stats.users.total.toLocaleString() : '247',
      delta:     t('dashboard.admin.deltaMonth', { count: stats?.users.recentSignups ?? 12 }),
      icon:      ActivityIcon,
      color:     'blue',
      deltaType: 'positive',
    },
    {
      label:     t('dashboard.admin.activeApiKeys'),
      value:     '89',
      delta:     t('dashboard.admin.deltaWeek'),
      icon:      ZapIcon,
      color:     'green',
      deltaType: 'positive',
    },
    {
      label:     t('dashboard.admin.requestsToday'),
      value:     '12.4K',
      delta:     t('dashboard.admin.deltaReqs'),
      icon:      TrendingUpIcon,
      color:     'orange',
      deltaType: 'positive',
    },
    {
      label:     t('dashboard.admin.unreadNotifs'),
      value:     stats ? String(stats.notifications.unread) : '5',
      delta:     t('dashboard.admin.deltaUrgent', { count: stats ? Math.min(stats.notifications.unread, 2) : 2 }),
      icon:      BellIcon,
      color:     'red',
      deltaType: 'negative',
    },
  ];

  return (
    <div className="adm">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="adm-welcome">
        <div className="adm-welcome__text">
          <h1 className="adm-welcome__title">{t('dashboard.admin.title')}</h1>
          <p className="adm-welcome__sub">{t('dashboard.admin.pageSubtitle')}</p>
        </div>
        <div className="adm-welcome__actions">
          <button className="adm-btn adm-btn--outline" onClick={() => navigate('/dashboard/admin-users')}>
            <UsersIcon />
            {t('dashboard.admin.manageDevs')}
          </button>
          <button className="adm-btn adm-btn--primary" onClick={() => setShowBroadcast(true)}>
            <BroadcastIcon />
            {t('dashboard.admin.sendNotif')}
          </button>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="adm-stat-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              className="adm-stat-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="adm-stat-card__header">
                <span className={`adm-stat-card__icon adm-stat-card__icon--${card.color}`}>
                  <Icon />
                </span>
                <span className="adm-stat-card__label">{card.label}</span>
              </div>
              <div className="adm-stat-card__value">{card.value}</div>
              <div className={`adm-stat-card__delta adm-stat-card__delta--${card.deltaType}`}>
                {card.delta}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div className="adm-charts-row">

        {/* Area chart — weekly requests */}
        <div className="adm-chart-card adm-chart-card--large">
          <div className="adm-chart-card__header">
            <div>
              <h3 className="adm-chart-card__title">{t('dashboard.admin.weeklyChartTitle')}</h3>
              <p className="adm-chart-card__sub">{t('dashboard.admin.weeklyChartSub')}</p>
            </div>
            <span className="adm-badge adm-badge--positive">{t('dashboard.admin.weeklyBadge')}</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0972d3" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0972d3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#687078' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#687078' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <RechartsTooltip
                formatter={(v) => [typeof v === 'number' ? v.toLocaleString() : String(v ?? 0), t('dashboard.admin.tooltipRequests')]}
                contentStyle={{ border: '1px solid #d5dbdb', borderRadius: 6, fontSize: 13 }}
              />
              <Area type="monotone" dataKey="requests" stroke="#0972d3" strokeWidth={2}
                fill="url(#reqGrad)" dot={false} activeDot={{ r: 4, fill: '#0972d3' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart — tier distribution */}
        <div className="adm-chart-card">
          <div className="adm-chart-card__header">
            <div>
              <h3 className="adm-chart-card__title">{t('dashboard.admin.tierChartTitle')}</h3>
              <p className="adm-chart-card__sub">{t('dashboard.admin.tierChartSub')}</p>
            </div>
          </div>
          {tierChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tierChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#687078' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#687078' }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  formatter={(v) => [typeof v === 'number' ? v : Number(v ?? 0), t('dashboard.admin.tooltipDevs')]}
                  contentStyle={{ border: '1px solid #d5dbdb', borderRadius: 6, fontSize: 13 }}
                />
                <Bar dataKey="value" name={t('dashboard.admin.tooltipDevs')} radius={[4, 4, 0, 0]}>
                  {tierChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="adm-chart-card__empty">{t('dashboard.admin.chartLoading')}</div>
          )}
          <div className="adm-tier-legend">
            {Object.entries(TIER_COLORS).map(([tier, color]) => (
              <div key={tier} className="adm-tier-legend__item">
                <span className="adm-tier-legend__dot" style={{ background: color }} />
                <span className="adm-tier-legend__label">{tier}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row ───────────────────────────────────────────────────── */}
      <div className="adm-bottom-row">

        {/* Developer table */}
        <div className="adm-table-card">
          <div className="adm-table-card__header">
            <div>
              <h3 className="adm-table-card__title">{t('dashboard.admin.recentDevs')}</h3>
              <p className="adm-table-card__sub">{t('dashboard.admin.recentDevsSub')}</p>
            </div>
            <button className="adm-link-btn" onClick={() => navigate('/dashboard/admin-users')}>
              {t('dashboard.admin.viewAll')} <ArrowRightIcon />
            </button>
          </div>
          <div className="adm-table-wrapper">
            {isLoading ? (
              <div className="adm-loading">
                <div className="adm-spinner" />
                <p>{t('dashboard.admin.loadingDevs')}</p>
              </div>
            ) : users.length === 0 ? (
              <div className="adm-empty">
                <UsersIcon />
                <p>{t('dashboard.admin.noDevs')}</p>
              </div>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>{t('dashboard.admin.colDeveloper')}</th>
                    <th>{t('dashboard.admin.colTier')}</th>
                    <th>{t('dashboard.admin.colApiStatus')}</th>
                    <th>{t('dashboard.admin.colApiKeys')}</th>
                    <th>{t('dashboard.admin.colRegistration')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td>
                        <div className="adm-user-cell">
                          <div className="adm-avatar">
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                          <div className="adm-user-info">
                            <span className="adm-user-name">{user.firstName} {user.lastName}</span>
                            <span className="adm-user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`adm-tier-badge adm-tier-badge--${user.tier || 'free'}`}>
                          {user.tier || 'free'}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-status-badge adm-status-badge--${user.activeApiSettings ? 'active' : 'inactive'}`}>
                          {user.activeApiSettings ? t('dashboard.admin.statusActive') : t('dashboard.admin.statusInactive')}
                        </span>
                      </td>
                      <td className="adm-cell-center">
                        {user.activeApiSettings ? (
                          <span className="adm-credits">
                            {t('dashboard.admin.credits', { count: user.activeApiSettings.totalCredits.toLocaleString() })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="adm-date">{formatDate(user.createdAt)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Notifications panel */}
        <div className="adm-notif-card">
          <div className="adm-notif-card__header">
            <div>
              <h3 className="adm-notif-card__title">{t('dashboard.admin.recentNotifs')}</h3>
              <p className="adm-notif-card__sub">{t('dashboard.admin.recentNotifsSub')}</p>
            </div>
            <button className="adm-link-btn" onClick={() => navigate('/dashboard/admin-notifications')}>
              {t('dashboard.admin.manage')} <ArrowRightIcon />
            </button>
          </div>
          <div className="adm-notif-list">
            {notifications.length === 0 ? (
              <div className="adm-empty" style={{ padding: '32px 0' }}>
                <BellIcon />
                <p>{t('dashboard.admin.noNotifs')}</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif._id} className="adm-notif-item">
                  <div
                    className="adm-notif-item__dot"
                    style={{ background: NOTIF_COLORS[notif.type] || '#687078' }}
                  />
                  <div className="adm-notif-item__content">
                    <div className="adm-notif-item__title">{t18n(notif.title)}</div>
                    <div className="adm-notif-item__meta">
                      {notif.global
                        ? t('dashboard.admin.broadcastLabel')
                        : notif.user
                          ? `${notif.user.firstName} ${notif.user.lastName}`
                          : '—'}
                      {' · '}{timeAgo(notif.createdAt)}
                    </div>
                  </div>
                  <span className={`adm-notif-badge adm-notif-badge--${notif.type}`}>
                    {notif.type}
                  </span>
                  <button
                    className="adm-icon-btn"
                    onClick={() => ctrl.deleteNotification(notif._id)}
                    title={t('dashboard.admin.deleteTooltip')}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick broadcast */}
          <div className="adm-quick-broadcast">
            <p className="adm-quick-broadcast__label">{t('dashboard.admin.quickBroadcast')}</p>
            <button className="adm-btn adm-btn--outline adm-btn--sm" onClick={() => setShowBroadcast(true)}>
              <BroadcastIcon />
              {t('dashboard.admin.newNotif')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Success toast ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {broadcastSent && (
          <motion.div
            className="adm-toast adm-toast--success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <CheckIcon />
            {t('dashboard.admin.broadcastSent')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Broadcast modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBroadcast && (
          <motion.div
            className="adm-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowBroadcast(false)}
          >
            <motion.div
              className="adm-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="adm-modal__header">
                <div>
                  <h2 className="adm-modal__title">{t('dashboard.admin.modalTitle')}</h2>
                  <p className="adm-modal__sub">{t('dashboard.admin.modalSub')}</p>
                </div>
                <button className="adm-icon-btn" onClick={() => setShowBroadcast(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="adm-modal__body">
                <div className="adm-form-group">
                  <label className="adm-label">{t('dashboard.admin.labelTitle')}</label>
                  <input
                    className="adm-input"
                    type="text"
                    placeholder={t('dashboard.admin.titlePlaceholder')}
                    value={broadcastForm.title}
                    onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">{t('dashboard.admin.labelMessage')}</label>
                  <textarea
                    className="adm-textarea"
                    rows={4}
                    placeholder={t('dashboard.admin.messagePlaceholder')}
                    value={broadcastForm.message}
                    onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">{t('dashboard.admin.labelType')}</label>
                  <select
                    className="adm-select"
                    value={broadcastForm.type}
                    onChange={e => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                  >
                    <option value="info">{t('dashboard.admin.typeInfo')}</option>
                    <option value="success">{t('dashboard.admin.typeSuccess')}</option>
                    <option value="warning">{t('dashboard.admin.typeWarning')}</option>
                    <option value="error">{t('dashboard.admin.typeError')}</option>
                  </select>
                </div>
              </div>
              <div className="adm-modal__footer">
                <button className="adm-btn adm-btn--ghost" onClick={() => setShowBroadcast(false)}>
                  {t('common.cancel')}
                </button>
                <button
                  className="adm-btn adm-btn--primary"
                  onClick={handleBroadcast}
                  disabled={isSending || !broadcastForm.title.trim() || !broadcastForm.message.trim()}
                >
                  {isSending ? t('dashboard.admin.sending') : t('dashboard.admin.sendToAll')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
