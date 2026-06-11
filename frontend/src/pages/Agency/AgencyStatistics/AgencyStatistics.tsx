import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api';
import '../AgencyDashboard/AgencyDashboard.scss';

interface StatsData {
  totalDeliveries: number;
  monthlyDeliveries: number;
  activeDrivers: number;
  totalMerchants: number;
  deliveredCount: number;
  cancelledCount: number;
  successRate: number;
  monthlyTrend: { month: string; count: number }[];
  topDrivers: { name: string; total: number }[];
}

const AgencyStatistics: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats]     = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/v1/agencies/me/statistics')
      .then(res => setStats(res.data.data))
      .catch(err => {
        const msg = err?.response?.data?.message || t('agency.statistics.loadingError');
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <div className="agency-dashboard"><p className="ag-empty">{t('common.loading')}</p></div>;

  if (error) return (
    <div className="agency-dashboard">
      <div className="ag-page-header"><div><h1>{t('agency.statistics.title')}</h1></div></div>
      <div className="ag-alert ag-alert--error">{error}</div>
    </div>
  );

  if (!stats) return null;

  const safeTrend   = Array.isArray(stats.monthlyTrend) ? stats.monthlyTrend : [];
  const safeDrivers = Array.isArray(stats.topDrivers)   ? stats.topDrivers   : [];
  const maxTrend    = Math.max(...safeTrend.map(m => m.count), 1);

  return (
    <div className="agency-dashboard">
      <div className="ag-page-header">
        <div>
          <h1>{t('agency.statistics.title')}</h1>
          <p>{t('agency.statistics.subtitle')}</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="ag-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: t('agency.statistics.kpiTotal'),         value: stats.totalDeliveries,   icon: '📦' },
          { label: t('agency.statistics.kpiMonth'),         value: stats.monthlyDeliveries, icon: '📅' },
          { label: t('agency.statistics.kpiActiveDrivers'), value: stats.activeDrivers,     icon: '🚚' },
          { label: t('agency.statistics.kpiMerchants'),     value: stats.totalMerchants,    icon: '🏪' },
          { label: t('agency.statistics.kpiSuccessRate'),   value: `${stats.successRate}%`, icon: '✅' },
          { label: t('agency.statistics.kpiCancelled'),     value: stats.cancelledCount,    icon: '❌' },
        ].map(card => (
          <div key={card.label} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 22 }}>{card.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16191f' }}>{card.value}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', color: '#16191f' }}>{t('agency.statistics.chartTitle')}</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
          {safeTrend.map(item => (
            <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{item.count}</div>
              <div style={{
                width: '100%',
                height: `${Math.max(4, (item.count / maxTrend) * 120)}px`,
                background: 'linear-gradient(180deg, #3b82f6, #1a73e8)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.4s ease',
              }} />
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>{item.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top drivers */}
      {safeDrivers.length > 0 && (
        <div className="ag-section">
          <div className="ag-section__header">
            <h2>{t('agency.statistics.topDrivers')}</h2>
          </div>
          <div className="ag-table-wrap">
            <table className="ag-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('agency.statistics.colDriver')}</th>
                  <th>{t('agency.statistics.colDeliveries')}</th>
                </tr>
              </thead>
              <tbody>
                {safeDrivers.map((d, i) => (
                  <tr key={i}>
                    <td style={{ color: '#94a3b8', fontWeight: 600 }}>#{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>
                      <span style={{
                        background: '#eff6ff', color: '#1a73e8',
                        padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                      }}>
                        {d.total}
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

export default AgencyStatistics;
