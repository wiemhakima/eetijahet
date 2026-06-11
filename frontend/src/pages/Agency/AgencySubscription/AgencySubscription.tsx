import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAgencyController } from '../../../controllers/useAgencyController';
import '../AgencyDashboard/AgencyDashboard.scss';

// ── Plan definitions (feature names are i18n keys) ────────────────────────────

const PLANS = [
  {
    id: 'basic' as const,
    name: 'Basic',
    icon: '🥉',
    price: 9,
    descKey: 'agency.subscription.descBasic',
    limits: { deliveries: 20, drivers: 2, merchants: 3 },
    features: [
      { key: 'agency.subscription.feat20Deliveries', included: true,  limited: true  },
      { key: 'agency.subscription.feat2Drivers',     included: true                  },
      { key: 'agency.subscription.feat3Merchants',   included: true                  },
      { key: 'agency.subscription.featStats',        included: false                 },
      { key: 'agency.subscription.featFinances',     included: false                 },
      { key: 'agency.subscription.featExport',       included: false                 },
    ],
  },
  {
    id: 'medium' as const,
    name: 'Medium',
    icon: '🥈',
    price: 25,
    descKey: 'agency.subscription.descMedium',
    limits: { deliveries: -1, drivers: 10, merchants: 15 },
    features: [
      { key: 'agency.subscription.featUnlimitedDeliveries', included: true, highlight: true },
      { key: 'agency.subscription.feat10Drivers',           included: true                   },
      { key: 'agency.subscription.feat15Merchants',         included: true                   },
      { key: 'agency.subscription.featStats',               included: true                   },
      { key: 'agency.subscription.featAdvancedFinances',    included: false                  },
      { key: 'agency.subscription.featExport',              included: false                  },
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    icon: '🥇',
    price: 49,
    descKey: 'agency.subscription.descPro',
    popular: true,
    limits: { deliveries: -1, drivers: -1, merchants: -1 },
    features: [
      { key: 'agency.subscription.featUnlimitedDeliveries', included: true, highlight: true },
      { key: 'agency.subscription.featUnlimitedDrivers',    included: true, highlight: true },
      { key: 'agency.subscription.featUnlimitedMerchants',  included: true, highlight: true },
      { key: 'agency.subscription.featAdvancedStats',       included: true                  },
      { key: 'agency.subscription.featCompleteFinances',    included: true                  },
      { key: 'agency.subscription.featExport',              included: true                  },
    ],
  },
];

const STATUS_LABEL_KEYS: Record<string, string> = {
  active:    'agency.subscription.statusActive',
  trialing:  'agency.subscription.statusTrialing',
  cancelled: 'agency.subscription.statusCancelled',
  past_due:  'agency.subscription.statusPastDue',
};

const STATUS_COLORS: Record<string, string> = {
  active:    '#10b981',
  trialing:  '#f59e0b',
  cancelled: '#ef4444',
  past_due:  '#ef4444',
};

// ── Component ─────────────────────────────────────────────────────────────────

const AgencySubscription: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ctrl = useAgencyController();
  const { agency, subscription, isLoading, error } = ctrl;
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    ctrl.loadSubscription();
    // loadAgency() is already called inside the controller on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trial countdown
  const trialDaysLeft = (() => {
    if (!agency || agency.status !== 'trial' || !agency.trialEndsAt) return null;
    return Math.max(0, Math.ceil((new Date(agency.trialEndsAt).getTime() - Date.now()) / 86_400_000));
  })();

  const currentPlan = PLANS.find(p => p.id === (subscription?.plan ?? 'basic')) ?? PLANS[0];

  const handleUpgrade = async (planId: string) => {
    if (planId === subscription?.plan) return;
    const result = await ctrl.upgradeSubscription({ plan: planId, billing });
    if (result) {
      navigate(`/agency/subscription/checkout?plan=${planId}&cycle=${billing}&subId=${(result as { _id?: string })._id ?? ''}`);
    }
  };

  return (
    <div className="agency-dashboard">
      <div className="ag-page-header">
        <div>
          <h1>{t('agency.subscription.title')}</h1>
          <p>{t('agency.subscription.subtitle')}</p>
        </div>
      </div>

      {error   && <div className="ag-alert ag-alert--error">{error}</div>}
      {success && <div className="ag-alert ag-alert--success">{success}</div>}

      {/* Current subscription info */}
      {subscription && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#16191f' }}>{t('agency.subscription.currentPlan')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1a73e8', textTransform: 'capitalize' }}>
                {currentPlan.icon} {currentPlan.name}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                {currentPlan.price} KWD{t('agency.subscription.perMonth')} · {t('agency.subscription.billing')} {t(subscription.billing === 'annual' ? 'agency.subscription.billingAnnual' : 'agency.subscription.billingMonthly')}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 20 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>{t('agency.subscription.statusLabel')}</div>
              <span style={{
                display: 'inline-block', marginTop: 4, padding: '3px 10px', borderRadius: 999,
                background: `${STATUS_COLORS[subscription.status] ?? '#64748b'}18`,
                color: STATUS_COLORS[subscription.status] ?? '#64748b', fontWeight: 600, fontSize: 12,
              }}>
                {t(STATUS_LABEL_KEYS[subscription.status] ?? subscription.status)}
              </span>
            </div>
            {trialDaysLeft !== null && (
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 20 }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>{t('agency.subscription.trialRemaining')}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: trialDaysLeft <= 3 ? '#ef4444' : '#f59e0b', marginTop: 4 }}>
                  {t('agency.subscription.trialDays', { count: trialDaysLeft })}
                </div>
              </div>
            )}
            {subscription.currentPeriodEnd && (
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 20 }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>{t('agency.subscription.periodEnd')}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#334155', marginTop: 4 }}>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['monthly', 'annual'] as const).map(b => (
          <button key={b} className={`ag-filter-btn ${billing === b ? 'active' : ''}`} onClick={() => setBilling(b)}>
            {b === 'monthly' ? t('agency.subscription.toggleMonthly') : t('agency.subscription.toggleAnnual')}
          </button>
        ))}
      </div>

      {/* Plans grid */}
      <div className="ag-plans">
        {PLANS.map(plan => {
          const isCurrent = plan.id === (subscription?.plan ?? 'basic');
          const isUpgrade = plan.price > currentPlan.price;

          return (
            <div
              key={plan.id}
              className={`ag-plan-card ${isCurrent ? 'selected' : ''} ${plan.popular ? 'ag-plan-card--popular' : ''}`}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>{t('agency.subscription.popular')}</div>
              )}

              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 28 }}>{plan.icon}</div>
                <div className="ag-plan-card__name">{plan.name}</div>
                <div className="ag-plan-card__desc">{t(plan.descKey)}</div>
                <div className="ag-plan-card__price" style={{ margin: '8px 0' }}>
                  {billing === 'annual'
                    ? <><strong>{Math.round(plan.price * 0.8)}</strong> KWD<span style={{ fontSize: 12, color: '#94a3b8' }}>{t('agency.subscription.perMonth')}</span></>
                    : <><strong>{plan.price}</strong> KWD<span style={{ fontSize: 12, color: '#94a3b8' }}>{t('agency.subscription.perMonth')}</span></>
                  }
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', fontSize: 13 }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                    color: feature.included ? '#16191f' : '#94a3b8',
                  }}>
                    <span style={{
                      fontWeight: 700,
                      color: feature.included
                        ? (feature.limited ? '#f59e0b' : '#10b981')
                        : '#e2e8f0',
                    }}>
                      {feature.included ? (feature.limited ? '⚠' : '✓') : '✗'}
                    </span>
                    <span style={{ fontWeight: (feature as { highlight?: boolean }).highlight ? 600 : 400 }}>
                      {t(feature.key)}
                    </span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button className="ag-btn" style={{ width: '100%', opacity: 0.6, cursor: 'default' }} disabled>
                  {t('agency.subscription.btnCurrentPlan')}
                </button>
              ) : isUpgrade ? (
                <button
                  className="ag-btn ag-btn--primary"
                  style={{ width: '100%' }}
                  disabled={isLoading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isLoading ? '…' : t('agency.subscription.btnUpgrade')}
                </button>
              ) : (
                <button
                  className="ag-btn"
                  style={{ width: '100%', background: '#f1f5f9', color: '#64748b' }}
                  disabled={isLoading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {t('agency.subscription.btnDowngrade')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Invoice history */}
      {subscription?.invoices && subscription.invoices.length > 0 && (
        <div className="ag-section" style={{ marginTop: 32 }}>
          <div className="ag-section__header">
            <h2>{t('agency.subscription.invoiceTitle')}</h2>
          </div>
          <div className="ag-table-wrap">
            <table className="ag-table">
              <thead>
                <tr>
                  <th>{t('agency.subscription.colDate')}</th>
                  <th>{t('agency.subscription.colAmount')}</th>
                  <th>{t('agency.subscription.colCurrency')}</th>
                  <th>{t('agency.subscription.colInvoice')}</th>
                </tr>
              </thead>
              <tbody>
                {subscription.invoices.map((inv, i) => (
                  <tr key={i}>
                    <td>{new Date(inv.paidAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{inv.amount}</td>
                    <td>{inv.currency}</td>
                    <td>
                      {inv.invoiceUrl
                        ? <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', fontWeight: 600 }}>{t('agency.subscription.download')}</a>
                        : '—'}
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

export default AgencySubscription;
