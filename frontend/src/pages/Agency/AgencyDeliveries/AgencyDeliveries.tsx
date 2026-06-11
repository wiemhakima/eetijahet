import '../AgencyDashboard/AgencyDashboard.scss';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgencyController } from '../../../controllers/useAgencyController';

const DOT_COLORS: Record<string, string> = {
  pending:          '#f59e0b',
  going_to_pickup:  '#3b82f6',
  picked_up:        '#8b5cf6',
  on_the_way:       '#8b5cf6',
  delivered:        '#10b981',
  completed:        '#10b981',
  cancelled:        '#ef4444',
  canceled:         '#ef4444',   // Armada uses American spelling
  failed:           '#ef4444',
};

const REFRESH_INTERVAL = 30;

const AgencyDeliveries: React.FC = () => {
  const { t } = useTranslation();
  const ctrl = useAgencyController();
  const { deliveries: rawDeliveries, deliveriesTotal, isLoading, error, stats, agencyMerchants: rawMerchants } = ctrl;
  const deliveries     = Array.isArray(rawDeliveries) ? rawDeliveries : [];
  const agencyMerchants = Array.isArray(rawMerchants) ? rawMerchants : [];

  const STATUSES = [
    { value: '',          label: t('agency.deliveries.statusAll')       },
    { value: 'pending',   label: t('agency.deliveries.statusPending')   },
    { value: 'delivered', label: t('agency.deliveries.statusDelivered') },
    { value: 'cancelled', label: t('agency.deliveries.statusCancelled') },
    { value: 'failed',    label: t('agency.deliveries.statusFailed')    },
  ];

  const STATUS_LABELS: Record<string, string> = {
    pending:          t('agency.deliveries.statusPending'),
    going_to_pickup:  t('agency.deliveries.statusDispatched'),
    picked_up:        t('agency.deliveries.statusPickedUp'),
    on_the_way:       t('agency.deliveries.statusEnRoute'),
    delivered:        t('agency.deliveries.statusDelivered'),
    completed:        t('agency.deliveries.statusDelivered'),
    cancelled:        t('agency.deliveries.statusCancelled'),
    canceled:         t('agency.deliveries.statusCancelled'),  // Armada uses American spelling
    failed:           t('agency.deliveries.statusFailed'),
  };

  const [activeStatus,      setActiveStatus]      = useState('');
  const [selectedMerchant,  setSelectedMerchant]  = useState('');
  const [searchQuery,       setSearchQuery]        = useState('');
  const [page,              setPage]               = useState(1);
  const [countdown,         setCountdown]          = useState(REFRESH_INTERVAL);
  const limit = 20;

  const loadDeliveries = useCallback(() => {
    ctrl.loadDeliveries({
      status:     activeStatus     || undefined,
      page,
      merchantId: selectedMerchant || undefined,
    });
    ctrl.loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus, page, selectedMerchant]);

  useEffect(() => {
    ctrl.loadMerchants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDeliveries();
    setCountdown(REFRESH_INTERVAL);
  }, [loadDeliveries]);

  useEffect(() => {
    // Countdown display — pure state update with no side effects inside the updater
    const countdownTimer = setInterval(() => {
      setCountdown(c => (c > 1 ? c - 1 : REFRESH_INTERVAL));
    }, 1000);

    // Separate interval for the actual data refresh — never called inside a state updater
    const refreshTimer = setInterval(() => {
      loadDeliveries();
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(refreshTimer);
    };
  }, [loadDeliveries]);

  const handleStatusChange   = (status: string) => { setActiveStatus(status); setPage(1); };
  const handleMerchantChange = (id: string)     => { setSelectedMerchant(id); setPage(1); };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return deliveries;
    return deliveries.filter(d =>
      d.customerName?.toLowerCase().includes(q)        ||
      d.code?.toLowerCase().includes(q)                ||
      d.armadaId?.toLowerCase().includes(q)            ||
      d.destinationCity?.toLowerCase().includes(q)     ||
      d.destinationAddress?.toLowerCase().includes(q)  ||
      d.merchant?.storeName?.toLowerCase().includes(q)
    );
  }, [deliveries, searchQuery]);

  const totalPages = Math.ceil(deliveriesTotal / limit);

  const statCards = [
    {
      label: t('agency.deliveries.statTotalOrders'),
      value: stats?.deliveriesTotal ?? deliveriesTotal,
      borderColor: '#2563eb', valueColor: '#2563eb',
    },
    {
      label: t('agency.deliveries.statPending'),
      value: stats?.pendingCount ?? '—',
      borderColor: '#d97706', valueColor: '#d97706',
    },
    {
      label: t('agency.deliveries.statDelivered'),
      value: stats?.deliveredCount ?? '—',
      borderColor: '#059669', valueColor: '#059669',
    },
    {
      label: t('agency.deliveries.statCommission'),
      value: stats ? `${stats.totalCommission.toFixed(2)} KWD` : '—',
      borderColor: '#ea580c', valueColor: '#ea580c',
    },
  ];

  return (
    <div className="agency-dashboard" style={{ position: 'relative' }}>

      {/* Header */}
      <div className="ag-page-header">
        <div>
          <h1>{t('agency.deliveries.title')}</h1>
          <p>{t('agency.deliveries.subtitle', { total: deliveriesTotal })}</p>
        </div>
      </div>

      {error && <div className="ag-alert ag-alert--error">{error}</div>}

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderTop: `3px solid ${card.borderColor}`,
            borderRadius: 12,
            padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.valueColor, lineHeight: 1 }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>

        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13, pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            className="ag-input"
            style={{ paddingLeft: 32, margin: 0 }}
            placeholder={t('agency.deliveries.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {agencyMerchants.length > 0 && (
          <select
            className="ag-input"
            style={{ flex: '0 0 200px', margin: 0 }}
            value={selectedMerchant}
            onChange={e => handleMerchantChange(e.target.value)}
          >
            <option value="">{t('agency.deliveries.allStores')}</option>
            {agencyMerchants.map(m => (
              <option key={m._id} value={m._id}>{m.storeName}</option>
            ))}
          </select>
        )}

        <div className="ag-filters" style={{ margin: 0 }}>
          {STATUSES.map(s => (
            <button
              key={s.value}
              className={`ag-filter-btn ${activeStatus === s.value ? 'active' : ''}`}
              onClick={() => handleStatusChange(s.value)}
            >
              {s.value && (
                <span style={{
                  display: 'inline-block',
                  width: 6, height: 6, borderRadius: '50%',
                  background: activeStatus === s.value ? '#fff' : (DOT_COLORS[s.value] ?? '#64748b'),
                  marginRight: 5,
                  verticalAlign: 'middle',
                }} />
              )}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="ag-section">
        <div className="ag-table-wrap">
          {isLoading ? (
            <p className="ag-empty">{t('agency.deliveries.loading')}</p>
          ) : filtered.length === 0 ? (
            <p className="ag-empty">{t('agency.deliveries.noDeliveries')}</p>
          ) : (
            <table className="ag-table">
              <thead>
                <tr>
                  <th>{t('agency.deliveries.colCode')}</th>
                  <th>{t('agency.deliveries.colStore')}</th>
                  <th>{t('agency.deliveries.colClient')}</th>
                  <th>{t('agency.deliveries.colDestination')}</th>
                  <th>{t('agency.deliveries.colStatus')}</th>
                  <th>{t('agency.deliveries.colAmount')}</th>
                  <th>{t('agency.deliveries.colFee')}</th>
                  <th>{t('agency.deliveries.colArmada')}</th>
                  <th>{t('agency.deliveries.colDate')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const code        = d.code || d.armadaId?.slice(0, 8) || '—';
                  const destination = [d.destinationCity, d.destinationAddress].filter(Boolean).join(', ') || '—';
                  const dotColor    = DOT_COLORS[d.status] ?? '#64748b';
                  const statusLabel = STATUS_LABELS[d.status] ?? d.status;
                  const isPulsing   = d.status === 'pending' || d.status === 'going_to_pickup' || d.status === 'on_the_way';

                  return (
                    <tr key={d._id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#2563eb' }}>
                          {code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>
                        {d.merchant?.storeName ?? '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{d.customerName || '—'}</div>
                        {d.customerPhone && (
                          <div style={{ fontSize: 11, color: '#64748b' }}>{d.customerPhone}</div>
                        )}
                      </td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                        {destination}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: `${dotColor}14`, color: dotColor,
                          fontWeight: 700, fontSize: 11,
                          padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%', background: dotColor,
                            display: 'inline-block', flexShrink: 0,
                            boxShadow: isPulsing ? `0 0 0 3px ${dotColor}30` : 'none',
                          }} />
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>
                        {(d.productAmount ?? 0).toFixed(2)} KWD
                      </td>
                      <td style={{ color: '#d97706', fontWeight: 600, fontSize: 13 }}>
                        {(d.deliveryFee ?? 0).toFixed(2)} KWD
                      </td>
                      <td>
                        {d.armadaId ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{
                              fontFamily: 'monospace', fontSize: 11, color: '#16a34a',
                              background: 'rgba(22,163,74,0.08)', padding: '2px 6px',
                              borderRadius: 4, display: 'inline-block',
                            }}>
                              {d.armadaId.slice(0, 12)}…
                            </span>
                            {d.trackingLink && (
                              <a
                                href={d.trackingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ag-btn ag-btn--primary ag-btn--sm"
                                style={{ fontSize: 11, padding: '3px 8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                📍 Track
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap', fontSize: 13 }}>
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
            <button className="ag-btn ag-btn--outline ag-btn--sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              {t('agency.deliveries.previous')}
            </button>
            <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} / {totalPages}</span>
            <button className="ag-btn ag-btn--outline ag-btn--sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
              {t('agency.deliveries.next')}
            </button>
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 100,
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
        padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: '#64748b', boxShadow: '0 2px 12px rgba(0,0,0,.08)',
      }}>
        <span className="ag-refresh-dot" />
        {t('agency.deliveries.refreshIn', { countdown })}
      </div>
    </div>
  );
};

export default AgencyDeliveries;
