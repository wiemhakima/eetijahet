import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDeliveries } from '../../store/slices/deliverySlice';
import i18n from '../../i18n';
import './ClientDashboard.scss';

// ─── Icons ────────────────────────────────────────────────────────────────────

const PackageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const TruckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1.5"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);
const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/><circle cx="16" cy="13" r="1"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><polyline points="12,5 19,12 12,19"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'En attente',  cls: 'status--pending' },
  accepted:    { label: 'Accepté',     cls: 'status--accepted' },
  picked_up:   { label: 'Colis récupéré', cls: 'status--progress' },
  in_transit:  { label: 'En route',    cls: 'status--progress' },
  delivered:   { label: 'Livré',       cls: 'status--delivered' },
  cancelled:   { label: 'Annulé',      cls: 'status--cancelled' },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Component ────────────────────────────────────────────────────────────────

const ClientDashboard: React.FC = () => {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const { user }  = useAppSelector(s => s.auth);
  const { deliveries: rawDeliveries, isLoading, pagination } = useAppSelector(s => s.delivery);
  const deliveries = Array.isArray(rawDeliveries) ? rawDeliveries : [];

  useEffect(() => {
    dispatch(fetchDeliveries({ limit: 20 }));
  }, [dispatch]);

  const firstName   = user?.firstName || 'Client';
  const inProgress  = deliveries.filter(d => ['accepted', 'picked_up', 'in_transit'].includes(d.clientStatus)).length;
  const delivered   = deliveries.filter(d => d.clientStatus === 'delivered').length;
  const totalMonth  = pagination.total;
  const totalSpent  = deliveries
    .filter(d => d.clientStatus === 'delivered' && d.estimatedPrice)
    .reduce((s, d) => s + (d.estimatedPrice ?? 0), 0);

  const recent = [...deliveries].slice(0, 5);

  return (
    <div className="client-dashboard">
      {/* Welcome */}
      <div className="cd-welcome">
        <div className="cd-welcome__text">
          <h1 className="cd-welcome__title">Bonjour, {firstName} 👋</h1>
          <p className="cd-welcome__subtitle">Gérez vos livraisons et suivez vos commandes en temps réel.</p>
        </div>
        <button className="cd-btn cd-btn--primary" onClick={() => navigate('/client/new-delivery')}>
          <PlusIcon /> Nouvelle livraison
        </button>
      </div>

      {/* Stats */}
      <div className="cd-stats">
        <div className="cd-stat-card">
          <div className="cd-stat-card__header">
            <span className="cd-stat-card__icon cd-stat-card__icon--blue"><PackageIcon /></span>
            <span className="cd-stat-card__label">Total commandes</span>
          </div>
          <div className="cd-stat-card__value">{isLoading ? '—' : totalMonth}</div>
          <div className="cd-stat-card__sub">toutes vos commandes</div>
        </div>
        <div className="cd-stat-card">
          <div className="cd-stat-card__header">
            <span className="cd-stat-card__icon cd-stat-card__icon--orange"><TruckIcon /></span>
            <span className="cd-stat-card__label">En cours</span>
          </div>
          <div className="cd-stat-card__value">{isLoading ? '—' : inProgress}</div>
          <div className="cd-stat-card__sub">en cours de livraison</div>
        </div>
        <div className="cd-stat-card">
          <div className="cd-stat-card__header">
            <span className="cd-stat-card__icon cd-stat-card__icon--green"><CheckCircleIcon /></span>
            <span className="cd-stat-card__label">Terminées</span>
          </div>
          <div className="cd-stat-card__value">{isLoading ? '—' : delivered}</div>
          <div className="cd-stat-card__sub">livrées avec succès</div>
        </div>
        <div className="cd-stat-card">
          <div className="cd-stat-card__header">
            <span className="cd-stat-card__icon cd-stat-card__icon--teal"><WalletIcon /></span>
            <span className="cd-stat-card__label">Dépenses</span>
          </div>
          <div className="cd-stat-card__value">{isLoading ? '—' : totalSpent.toFixed(3)}</div>
          <div className="cd-stat-card__sub">KWD dépensés</div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="cd-orders">
        <div className="cd-orders__header">
          <div>
            <h3 className="cd-orders__title">Dernières commandes</h3>
            <p className="cd-orders__desc">Vos 5 commandes les plus récentes</p>
          </div>
          <button className="cd-link-btn" onClick={() => navigate('/client/deliveries')}>
            Voir tout <ArrowRightIcon />
          </button>
        </div>

        {isLoading ? (
          <div className="cd-orders__loading">Chargement…</div>
        ) : recent.length === 0 ? (
          <div className="cd-orders__empty">
            <p>Vous n'avez pas encore de commandes.</p>
            <button className="cd-btn cd-btn--primary" onClick={() => navigate('/client/new-delivery')}>
              <PlusIcon /> Créer ma première livraison
            </button>
          </div>
        ) : (
          <div className="cd-orders__table-wrapper">
            <table className="cd-orders__table">
              <thead>
                <tr>
                  <th>Commande</th><th>Départ</th><th>Arrivée</th>
                  <th>ETA</th><th>Prix</th><th>Date</th><th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(order => {
                  const s = STATUS_MAP[order.clientStatus] || { label: order.clientStatus, cls: '' };
                  return (
                    <tr key={order._id} onClick={() => navigate(`/client/deliveries`)} style={{ cursor: 'pointer' }}>
                      <td className="cd-orders__id">{order.orderId || order._id.slice(-8)}</td>
                      <td><span className="cd-orders__addr"><MapPinIcon />{order.pickupLabel || `${order.pickupLat?.toFixed(3)}, ${order.pickupLng?.toFixed(3)}`}</span></td>
                      <td><span className="cd-orders__addr"><MapPinIcon />{order.dropoffLabel || `${order.dropoffLat?.toFixed(3)}, ${order.dropoffLng?.toFixed(3)}`}</span></td>
                      <td>
                        {order.eta_minutes
                          ? <span className="cd-orders__eta"><ClockIcon />{Math.round(order.eta_minutes)} min</span>
                          : <span className="cd-orders__dash">—</span>}
                      </td>
                      <td className="cd-orders__price">{order.estimatedPrice ? `${order.estimatedPrice.toFixed(3)} KWD` : '—'}</td>
                      <td className="cd-orders__date">{fmt(order.createdAt)}</td>
                      <td><span className={`cd-status ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {recent.length > 0 && (
          <div className="cd-orders__cta">
            <button className="cd-btn cd-btn--outline" onClick={() => navigate('/client/new-delivery')}>
              <PlusIcon /> Nouvelle commande
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
