import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { markAllAsRead } from '../store/slices/notificationsSlice';
import i18n from '../i18n';

const DOT_COLOR: Record<string, string> = {
  new_order:           '#3b82f6',
  order_status_update: '#10b981',
  order_failed:        '#ef4444',
  info:                '#6366f1',
  success:             '#10b981',
  warning:             '#f59e0b',
  error:               '#ef4444',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m    = Math.floor(diff / 60_000);
  if (m < 1)  return i18n.t('agency.timeAgo.justNow');
  if (m < 60) return i18n.t('agency.timeAgo.minutesAgo', { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return i18n.t('agency.timeAgo.hoursAgo', { count: h });
  return new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US');
}

const BellSVG = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#BA7517" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const NotificationBell: React.FC<{ navigateTo?: string }> = ({ navigateTo = '/agency/deliveries' }) => {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const { notifications, unreadCount } = useAppSelector(s => s.notifications);
  const [open, setOpen]       = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Persist "all read" to the backend whenever the panel is opened
  useEffect(() => {
    if (open && unreadCount > 0) {
      dispatch(markAllAsRead());
    }
  }, [open]);

  const recent = notifications.slice(0, 10);

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* Bell button — amber circle */}
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Notifications"
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: hovered ? '#f0d9b5' : '#FAEEDA',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        <BellSVG />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#E24B4A',
            color: '#fff',
            borderRadius: 10,
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1,
            padding: '1px 5px',
            minWidth: 16,
            textAlign: 'center',
            border: '2px solid #fff',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0, zIndex: 1000,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.12)', width: 360, maxWidth: '90vw',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#16191f' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: 6, fontSize: 12, color: '#ef4444', fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllAsRead())}
                style={{
                  background: 'none', border: 'none', fontSize: 12, fontWeight: 600,
                  color: '#3b82f6', cursor: 'pointer', padding: '2px 6px',
                  borderRadius: 4, transition: 'background .15s',
                }}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {recent.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucune notification
              </div>
            ) : (
              recent.map((n, i) => {
                const dotColor = DOT_COLOR[n.type] ?? '#64748b';
                return (
                  <div
                    key={n._id ?? i}
                    onClick={() => { navigate(navigateTo); setOpen(false); }}
                    style={{
                      display: 'flex', gap: 10, padding: '11px 16px', cursor: 'pointer',
                      borderBottom: i < recent.length - 1 ? '1px solid #f8fafc' : 'none',
                      background: n.type === 'order_failed' ? '#fff5f5' : n.isRead ? '#fff' : 'rgba(59,130,246,.04)',
                      borderLeft: n.type === 'order_failed' ? '3px solid #ef4444' : 'none',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = n.type === 'order_failed' ? '#fee2e2' : '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = n.type === 'order_failed' ? '#fff5f5' : n.isRead ? '#fff' : 'rgba(59,130,246,.04)')}
                  >
                    {/* Colored dot */}
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: dotColor, flexShrink: 0, marginTop: 4,
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: n.type === 'order_failed' ? '#ef4444' : '#16191f', marginBottom: 2 }}>
                        {n.title}
                      </div>
                      <div style={{
                        fontSize: 12, color: '#64748b',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!n.isRead && (
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#3b82f6', flexShrink: 0, marginTop: 5,
                      }} />
                    )}
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
