import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import MerchantLayout from '../MerchantLayout/MerchantLayout';
import i18n from '../../../i18n';

interface Profile {
  storeName: string;
  commission: number;
  address?: { street?: string; city?: string };
  agency?: { name: string };
}

interface Order {
  _id:                string;
  armadaId:           string;
  status:             string;
  code:               string | null;
  customerName:       string | null;
  destinationCity:    string | null;
  destinationAddress: string | null;
  amount:             number;
  deliveryFee:        number;
  raw:                Record<string, unknown>;
  createdAt:          string;
}

const INACTIVE_STATUSES = ['delivered', 'completed', 'cancelled'];

const STATUS_LABEL: Record<string, string> = {
  broadcasting: 'Diffusion',
  pending:      'En attente',
  dispatched:   'Dispatché',
  accepted:     'Accepté',
  picked_up:    'Récupéré',
  in_transit:   'En route',
  en_route:     'En route',
  delivered:    'Livrée',
  completed:    'Livrée',
  cancelled:    'Annulée',
  failed:       'Échouée',
};

const STATUS_CSS: Record<string, string> = {
  broadcasting: 'pending',
  pending:      'pending',
  dispatched:   'accepted',
  accepted:     'accepted',
  picked_up:    'picked_up',
  in_transit:   'in_transit',
  en_route:     'in_transit',
  delivered:    'delivered',
  completed:    'delivered',
  cancelled:    'cancelled',
  failed:       'cancelled',
};

const TODAY = new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, ordersRes] = await Promise.all([
          api.get('/v1/merchant/profile'),
          api.get('/v1/orders?limit=1000'),
        ]);
        setProfile(profileRes.data.data);
        const rawO = ordersRes.data.data;
        setOrders(Array.isArray(rawO) ? rawO : (rawO?.orders ?? []));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const safeOrders      = Array.isArray(orders) ? orders : [];
  const totalOrders     = safeOrders.length;
  const delivered       = safeOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
  const active          = safeOrders.filter(o => !INACTIVE_STATUSES.includes(o.status)).length;
  const totalRevenue    = safeOrders.reduce((sum, o) => sum + ((o.raw?.amount as number) || 0), 0);
  const totalCommission = safeOrders.reduce((sum, o) => sum + ((o.raw?.deliveryFee as number) || 0), 0);
  const commissionRate  = totalRevenue > 0 ? (totalCommission / totalRevenue * 100).toFixed(1) : 0;

  return (
    <MerchantLayout>

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div className="merchant-page-header">
        <div>
          <div className="merchant-page-header__title-row">
            <h1>{profile?.storeName ?? 'Dashboard'}</h1>
            {profile?.agency?.name && (
              <span className="merchant-agency-badge">{profile.agency.name}</span>
            )}
          </div>
          <p className="merchant-page-header__date">{TODAY}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="merchant-btn merchant-btn--primary merchant-btn--pill"
            onClick={() => navigate('/merchant/orders/new')}
          >
            + Nouvelle commande
          </button>
        </div>
      </div>

      {loading ? (
        <div className="merchant-loading">
          <div className="merchant-loading__spinner" />
          Chargement…
        </div>
      ) : (
        <>
          {/* ── Stats row 1 — 4 equal cards ─────────────────────────────────── */}
          <div className="merchant-stats">
            {([
              { label: 'Total commandes', value: totalOrders,          sub: 'Depuis le début',     bar: '#3b82f6', vc: '#3b82f6', icon: '📦', iconBg: '#eff6ff' },
              { label: 'Livrées',         value: delivered,            sub: 'Commandes terminées', bar: '#10b981', vc: '#10b981', icon: '✅', iconBg: '#ecfdf5' },
              { label: 'Actives',         value: active,               sub: 'En cours',            bar: '#6366f1', vc: '#6366f1', icon: '🔄', iconBg: '#eef2ff' },
              { label: 'Commission',      value: `${commissionRate}%`, sub: 'Taux appliqué',       bar: '#f59e0b', vc: '#f59e0b', icon: '💰', iconBg: '#fffbeb' },
            ] as const).map(c => (
              <div key={c.label} className="merchant-stat-card">
                <div className="merchant-stat-card__bar" style={{ background: c.bar }} />
                <div className="merchant-stat-card__body">
                  <div className="merchant-stat-card__header-row">
                    <div className="merchant-stat-card__label">{c.label}</div>
                    <div className="merchant-stat-card__icon" style={{ background: c.iconBg }}>
                      {c.icon}
                    </div>
                  </div>
                  <div className="merchant-stat-card__value" style={{ color: c.vc }}>{c.value}</div>
                  <div className="merchant-stat-card__sub">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Stats row 2 — 2 wide cards ───────────────────────────────────── */}
          <div className="merchant-stats merchant-stats--2">
            {([
              { label: "Chiffre d'affaires", value: `${totalRevenue.toFixed(2)} KWD`,    sub: 'Valeur produit', bar: '#3b82f6', vc: '#1e293b', trend: '📈' },
              { label: 'Commission totale',  value: `${totalCommission.toFixed(2)} KWD`, sub: "Dû à l'agence", bar: '#f59e0b', vc: '#f59e0b', trend: '💸' },
            ] as const).map(c => (
              <div key={c.label} className="merchant-stat-card">
                <div className="merchant-stat-card__bar" style={{ background: c.bar }} />
                <div className="merchant-stat-card__body">
                  <div className="merchant-stat-card__label">{c.label}</div>
                  <div className="merchant-stat-card__wide-row">
                    <div>
                      <div className="merchant-stat-card__value" style={{ color: c.vc }}>{c.value}</div>
                      <div className="merchant-stat-card__sub">{c.sub}</div>
                    </div>
                    <div className="merchant-stat-card__trend">{c.trend}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Recent orders ─────────────────────────────────────────────────── */}
          <div className="merchant-section">
            <div className="merchant-section-header">
              <span>Commandes récentes</span>
              <button
                className="merchant-btn merchant-btn--ghost"
                onClick={() => navigate('/merchant/orders')}
              >
                Voir tout →
              </button>
            </div>

            <div className="merchant-table-wrap">
              {orders.length === 0 ? (
                <div className="merchant-empty">
                  <div className="merchant-empty__icon">📦</div>
                  <p>Aucune commande récente.</p>
                  <button
                    className="merchant-btn merchant-btn--primary merchant-btn--pill"
                    style={{ marginTop: 12 }}
                    onClick={() => navigate('/merchant/orders/new')}
                  >
                    + Nouvelle commande
                  </button>
                </div>
              ) : (
                <table className="merchant-table">
                  <thead>
                    <tr>
                      <th>CODE</th>
                      <th>CLIENT</th>
                      <th>DESTINATION</th>
                      <th>STATUT</th>
                      <th>PRODUIT</th>
                      <th>FRAIS LIVRAISON</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeOrders.slice(0, 5).map(o => {
                      const displayCode = o.code || o.armadaId;
                      const destination = [o.destinationAddress, o.destinationCity].filter(Boolean).join(', ') || '—';
                      const cssStatus   = STATUS_CSS[o.status] ?? o.status;

                      return (
                        <tr key={o._id}>
                          <td>
                            <span className="merchant-order-code">{displayCode}</span>
                          </td>
                          <td>
                            <div className="merchant-customer">{o.customerName || '—'}</div>
                          </td>
                          <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {destination}
                          </td>
                          <td>
                            <span className={`merchant-badge merchant-badge--${cssStatus}`}>
                              {STATUS_LABEL[o.status] ?? o.status}
                            </span>
                          </td>
                          <td className="merchant-amount">
                            {(o.amount ?? 0).toFixed(2)} KWD
                          </td>
                          <td className="merchant-fee">
                            {(o.deliveryFee ?? 0).toFixed(2)} KWD
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                            {new Date(o.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </MerchantLayout>
  );
};

export default MerchantDashboard;
