import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import i18n from '../../../i18n';
import { useAgencyController } from '../../../controllers/useAgencyController';
import '../AgencyDashboard/AgencyDashboard.scss';

const PLAN_INFO = {
  basic:  { name: 'Basic',  icon: '🥉', monthly: 9,  annual: 86  },
  medium: { name: 'Medium', icon: '🥈', monthly: 25, annual: 240 },
  pro:    { name: 'Pro',    icon: '🥇', monthly: 49, annual: 470 },
} as const;

type PlanKey = keyof typeof PLAN_INFO;

const AgencyCheckout: React.FC = () => {
  const ctrl = useAgencyController();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [loading, setLoading] = useState(false);

  const plan   = (params.get('plan') || 'basic') as PlanKey;
  const cycle  = (params.get('cycle') || 'monthly') as 'monthly' | 'annual';
  const info   = PLAN_INFO[plan] ?? PLAN_INFO.basic;
  const price  = cycle === 'annual' ? info.annual : info.monthly;
  const cycleLabel = cycle === 'annual' ? 'Annuel' : 'Mensuel';

  const startDate = new Date();
  const endDate   = new Date();
  if (cycle === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  const fmt = (d: Date) => d.toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleSuccess = async () => {
    setLoading(true);
    setStatus('success');
    await ctrl.loadSubscription();
    await ctrl.loadAgency();
    setTimeout(() => navigate('/agency/subscription'), 1500);
  };

  const handleFailure = async () => {
    setLoading(true);
    setStatus('failed');
    await ctrl.cancelSubscription();
    setTimeout(() => navigate('/agency/subscription'), 1500);
  };

  return (
    <div className="agency-dashboard">

      {/* Test banner */}
      <div style={{
        background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8,
        padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>🧪</span>
        <span style={{ fontWeight: 700, color: '#854d0e', fontSize: 14 }}>
          MODE TEST — Aucun vrai paiement n'est effectué
        </span>
      </div>

      <div className="ag-page-header">
        <div>
          <h1>Confirmation de paiement</h1>
          <p>Vérifiez les détails de votre abonnement avant de confirmer</p>
        </div>
      </div>

      {status === 'success' && (
        <div className="ag-alert ag-alert--success">Abonnement activé avec succès 🎉 — Redirection...</div>
      )}
      {status === 'failed' && (
        <div className="ag-alert ag-alert--error">Paiement échoué — Redirection...</div>
      )}

      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Order recap */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Récapitulatif</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#16191f' }}>
                {info.icon} {info.name}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Facturation {cycleLabel}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
                Début : {fmt(startDate)}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Fin : {fmt(endDate)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#1a73e8', lineHeight: 1 }}>
                {price}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                KWD / {cycle === 'annual' ? 'an' : 'mois'}
              </div>
            </div>
          </div>
        </div>

        {/* Fake card form */}
        <div style={{
          background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 12,
          padding: 20, marginBottom: 20, opacity: 0.75,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Informations de carte (simulation)
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Numéro de carte</div>
              <input
                readOnly
                value="4005 5500 0000 0001"
                style={{
                  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
                  borderRadius: 6, background: '#fff', fontSize: 14, fontFamily: 'monospace',
                  boxSizing: 'border-box', cursor: 'not-allowed', color: '#64748b',
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Expiration</div>
                <input readOnly value="12/27" style={{
                  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
                  borderRadius: 6, background: '#fff', fontSize: 14, fontFamily: 'monospace',
                  cursor: 'not-allowed', color: '#64748b',
                }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>CVV</div>
                <input readOnly value="100" style={{
                  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
                  borderRadius: 6, background: '#fff', fontSize: 14, fontFamily: 'monospace',
                  cursor: 'not-allowed', color: '#64748b',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={handleFailure}
            disabled={status !== 'idle' || loading}
            style={{
              padding: '13px 16px', border: '2px solid #ef4444', borderRadius: 8,
              background: '#fff', color: '#ef4444', fontWeight: 700, fontSize: 13,
              cursor: status !== 'idle' ? 'not-allowed' : 'pointer', opacity: status !== 'idle' ? 0.5 : 1,
            }}
          >
            🔴 Simuler paiement ÉCHOUÉ
          </button>
          <button
            onClick={handleSuccess}
            disabled={status !== 'idle' || loading}
            style={{
              padding: '13px 16px', border: 'none', borderRadius: 8,
              background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: status !== 'idle' ? 'not-allowed' : 'pointer', opacity: status !== 'idle' ? 0.5 : 1,
            }}
          >
            🟢 Simuler paiement RÉUSSI
          </button>
        </div>

      </div>
    </div>
  );
};

export default AgencyCheckout;
