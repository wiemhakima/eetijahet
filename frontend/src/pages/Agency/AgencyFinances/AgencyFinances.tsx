import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api';
import '../AgencyDashboard/AgencyDashboard.scss';

interface FinancesData {
  totalRevenue: number;
  monthlyRevenue: number;
  monthlyDeliveries: number;
  monthlyBreakdown: { month: string; revenue: number; count: number }[];
  revenueByMerchant: { name: string; revenue: number; count: number }[];
  currency: string;
}

// ─── Donut chart (pure SVG, no lib) ─────────────────────────────────────────
interface DonutProps {
  data: { name: string; revenue: number; count: number }[];
  currency: string;
  fmt: (n: number) => string;
}

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
const CX = 80, CY = 80, R = 52, SW = 24;
const CIRCUMFERENCE = 2 * Math.PI * R;

const DonutChart: React.FC<DonutProps> = ({ data, currency, fmt }) => {
  const total = data.reduce((s, d) => s + d.revenue, 0);
  if (total === 0) return <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>—</p>;

  let cumAngle = -90; // start at 12 o'clock (SVG 0° = 3 o'clock)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg width={160} height={160} style={{ flexShrink: 0 }}>
        {/* track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
        {/* segments */}
        {data.map((item, i) => {
          const pct    = item.revenue / total;
          const segLen = pct * CIRCUMFERENCE;
          const rot    = cumAngle;
          cumAngle    += pct * 360;
          return (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth={SW}
              strokeDasharray={`${segLen} ${CIRCUMFERENCE - segLen}`}
              strokeDashoffset={0}
              transform={`rotate(${rot} ${CX} ${CY})`}
            />
          );
        })}
        {/* center label */}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="inherit">Total</text>
        <text x={CX} y={CY + 8} textAnchor="middle" fill="#16191f" fontSize="11" fontWeight="bold" fontFamily="inherit">
          {fmt(total)}
        </text>
        <text x={CX} y={CY + 22} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="inherit">{currency}</text>
      </svg>

      {/* legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, minWidth: 120 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16191f', whiteSpace: 'nowrap' }}>
              {((item.revenue / total) * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
const AgencyFinances: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData]       = useState<FinancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/v1/agencies/me/finances')
      .then(res => setData(res.data.data))
      .catch(err => {
        const msg = err?.response?.data?.message || t('agency.finances.loadingError');
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [t]);

  const fmt = (n: number, currency = 'KWD') =>
    `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  if (loading) return <div className="agency-dashboard"><p className="ag-empty">{t('common.loading')}</p></div>;

  if (error) return (
    <div className="agency-dashboard">
      <div className="ag-page-header"><div><h1>{t('agency.finances.title')}</h1></div></div>
      <div className="ag-alert ag-alert--error">{error}</div>
    </div>
  );

  if (!data) return null;

  const currency        = data.currency || 'KWD';
  const safeBreakdown   = Array.isArray(data.monthlyBreakdown)   ? data.monthlyBreakdown   : [];
  const safeByMerchant  = Array.isArray(data.revenueByMerchant) ? data.revenueByMerchant : [];
  const maxRevenue      = Math.max(...safeBreakdown.map(m => m.revenue), 1);
  const fmtC       = (n: number) => fmt(n, currency);

  const kpiCards = [
    { label: t('agency.finances.kpiTotalRevenue'),      value: fmtC(data.totalRevenue),                                                                     icon: '💰', accent: '#10b981', bg: '#f0fdf4' },
    { label: t('agency.finances.kpiMonthlyRevenue'),    value: fmtC(data.monthlyRevenue),                                                                   icon: '📅', accent: '#3b82f6', bg: '#eff6ff' },
    { label: t('agency.finances.kpiMonthlyDeliveries'), value: String(data.monthlyDeliveries),                                                              icon: '📦', accent: '#f59e0b', bg: '#fffbeb' },
    {
      label: t('agency.finances.kpiAvgBasket'),
      value: data.monthlyDeliveries > 0 ? fmtC(data.monthlyRevenue / data.monthlyDeliveries) : '—',
      icon: '📊', accent: '#8b5cf6', bg: '#f5f3ff',
    },
  ];

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="agency-dashboard">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="ag-page-header">
        <div>
          <h1>{t('agency.finances.title')}</h1>
          <p>{t('agency.finances.subtitle')}</p>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {kpiCards.map(card => (
          <div key={card.label} style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderLeft: `4px solid ${card.accent}`,
            borderRadius: 14,
            padding: '20px 20px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: card.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {card.icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16191f', letterSpacing: '-0.5px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row (bar + donut) ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>

        {/* Monthly bar chart */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px', color: '#16191f' }}>
            {t('agency.finances.chartMonthly')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
            {safeBreakdown.map(item => (
              <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#334155' }}>
                  {item.revenue > 0 ? item.revenue.toFixed(0) : ''}
                </div>
                <div
                  title={`${item.month}: ${item.revenue} ${currency}`}
                  style={{
                    width: '100%',
                    height: `${Math.max(4, (item.revenue / maxRevenue) * 130)}px`,
                    background: item.revenue === maxRevenue
                      ? 'linear-gradient(180deg, #10b981, #059669)'
                      : 'linear-gradient(180deg, #a7f3d0, #6ee7b7)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.4s ease',
                  }}
                />
                <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
                  {item.month}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart — revenue by merchant */}
        {safeByMerchant.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 20px', color: '#16191f' }}>
              {t('agency.finances.tableTitle')}
            </h2>
            <DonutChart data={safeByMerchant} currency={currency} fmt={fmtC} />
          </div>
        )}
      </div>

      {/* ── Top livreurs (top merchants) ────────────────────────────── */}
      {safeByMerchant.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 18px', color: '#16191f' }}>
            🏆 Top {t('agency.finances.colMerchant')}
          </h2>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {safeByMerchant.slice(0, 3).map((m, i) => (
              <div key={i} style={{
                flex: '1 1 160px',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                background: i === 0 ? '#fffbeb' : '#fafafa',
              }}>
                <div style={{ fontSize: 24 }}>{medals[i]}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#16191f' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {m.count} {t('agency.finances.colDeliveries')}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                  {fmtC(m.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tableau revenueByMerchant ────────────────────────────────── */}
      {safeByMerchant.length > 0 && (
        <div className="ag-section">
          <div className="ag-section__header">
            <h2>{t('agency.finances.tableTitle')}</h2>
          </div>
          <div className="ag-table-wrap">
            <table className="ag-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('agency.finances.colMerchant')}</th>
                  <th>{t('agency.finances.colDeliveries')}</th>
                  <th>{t('agency.finances.colRevenue')}</th>
                </tr>
              </thead>
              <tbody>
                {safeByMerchant.map((m, i) => (
                  <tr key={i}>
                    <td style={{ color: '#94a3b8', fontWeight: 600 }}>#{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td style={{ color: '#64748b' }}>{m.count}</td>
                    <td>
                      <span style={{
                        background: '#f0fdf4',
                        color: '#15803d',
                        padding: '3px 12px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                      }}>
                        {fmtC(m.revenue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AgencyFinances;
