import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import i18n from '../../i18n';
import { fetchDeliveries, cancelDelivery } from '../../store/slices/deliverySlice';
import type { ClientStatus } from '../../store/slices/deliverySlice';
import { fetchMyRatings } from '../../store/slices/ratingSlice';
import RatingModal from '../../components/RatingModal/RatingModal';
import './OrdersPage.scss';

const STATUS_MAP: Record<ClientStatus, { label: string; cls: string }> = {
  pending:     { label: 'En attente',      cls: 'os-status--pending' },
  accepted:    { label: 'Accepté',         cls: 'os-status--accepted' },
  picked_up:   { label: 'Colis récupéré',  cls: 'os-status--progress' },
  in_transit:  { label: 'En route',        cls: 'os-status--progress' },
  delivered:   { label: 'Livré',           cls: 'os-status--delivered' },
  cancelled:   { label: 'Annulé',          cls: 'os-status--cancelled' },
};

const PKG_LABELS: Record<string, string> = {
  document: 'Document', small: 'Petit colis', medium: 'Moyen',
  large: 'Grand', fragile: 'Fragile', food: 'Alimentation',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '',           label: 'Tous' },
  { value: 'pending',    label: 'En attente' },
  { value: 'accepted',   label: 'Accepté' },
  { value: 'picked_up',  label: 'Colis récupéré' },
  { value: 'in_transit', label: 'En route' },
  { value: 'delivered',  label: 'Livré' },
  { value: 'cancelled',  label: 'Annulé' },
];

const MapPinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const OrdersPage: React.FC = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const dispatch   = useAppDispatch();
  const isClient   = location.pathname.startsWith('/client');
  const { deliveries: rawDeliveries, isLoading, pagination, error } = useAppSelector(s => s.delivery);
  const { ratedDeliveryIds: rawRatedIds } = useAppSelector(s => s.ratings);
  const deliveries      = Array.isArray(rawDeliveries) ? rawDeliveries : [];
  const ratedDeliveryIds = Array.isArray(rawRatedIds)  ? rawRatedIds  : [];

  const [statusFilter,   setStatusFilter]   = useState('');
  const [page,           setPage]           = useState(1);
  const [cancelling,     setCancelling]     = useState<string | null>(null);
  const [ratingDelivery, setRatingDelivery] = useState<{ id: string; driverName?: string } | null>(null);

  useEffect(() => {
    dispatch(fetchDeliveries({ status: statusFilter || undefined, page, limit: 15 }));
  }, [dispatch, statusFilter, page]);

  // Load which deliveries are already rated (once on mount)
  useEffect(() => { dispatch(fetchMyRatings()); }, [dispatch]);

  const handleCancel = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;
    setCancelling(id);
    await dispatch(cancelDelivery(id));
    setCancelling(null);
  };

  const totalPages = Math.ceil(pagination.total / 15);

  return (
    <div className="orders-page">
      <div className="os-header">
        <div>
          <h2 className="os-header__title">Mes commandes</h2>
          <p className="os-header__desc">Historique complet de toutes vos livraisons</p>
        </div>
        <button className="os-btn-primary" onClick={() => navigate(isClient ? '/client/new-delivery' : '/dashboard/new-delivery')}>
          + New Delivery
        </button>
      </div>

      {/* Filters */}
      <div className="os-filters">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            className={`os-filter-btn ${statusFilter === f.value ? 'os-filter-btn--active' : ''}`}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="os-alert">{error}</div>}

      {isLoading ? (
        <div className="os-loading">Chargement…</div>
      ) : deliveries.length === 0 ? (
        <div className="os-empty">
          <p>Aucune commande trouvée{statusFilter ? ' pour ce filtre' : ''}.</p>
          <button className="os-btn-primary" onClick={() => navigate(isClient ? '/client/new-delivery' : '/dashboard/new-delivery')}>
            Create Order
          </button>
        </div>
      ) : (
        <div className="os-table-wrapper">
          <table className="os-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Départ</th>
                <th>Destination</th>
                <th>Colis</th>
                <th>Distance</th>
                <th>ETA</th>
                <th>Prix estimé</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(d => {
                const s = STATUS_MAP[d.clientStatus] || { label: d.clientStatus, cls: '' };
                const canCancel    = d.clientStatus === 'pending' || d.clientStatus === 'accepted';
                const canRate      = d.clientStatus === 'delivered';
                const alreadyRated = ratedDeliveryIds.includes(d._id);
                return (
                  <tr key={d._id}>
                    <td className="os-id">{d.orderId || d._id.slice(-8)}</td>
                    <td><span className="os-addr"><MapPinIcon />{d.pickupLabel || `${d.pickupLat?.toFixed(3)}, ${d.pickupLng?.toFixed(3)}`}</span></td>
                    <td><span className="os-addr"><MapPinIcon />{d.dropoffLabel || `${d.dropoffLat?.toFixed(3)}, ${d.dropoffLng?.toFixed(3)}`}</span></td>
                    <td>{PKG_LABELS[d.packageType] || d.packageType}</td>
                    <td>{d.distance_km ? `${d.distance_km} km` : '—'}</td>
                    <td>{d.eta_minutes ? `${Math.round(d.eta_minutes)} min` : '—'}</td>
                    <td className="os-price">{d.estimatedPrice ? `${d.estimatedPrice.toFixed(3)} KWD` : '—'}</td>
                    <td className="os-date">{fmt(d.createdAt)}</td>
                    <td><span className={`os-status ${s.cls}`}>{s.label}</span></td>
                    <td className="os-actions-cell">
                      {isClient && (
                        <button
                          className="os-details-btn"
                          onClick={() => navigate(`/client/deliveries/${d._id}`)}
                          title="View details & live map"
                        >
                          Details
                        </button>
                      )}
                      {canCancel && (
                        <button
                          className="os-cancel-btn"
                          onClick={() => handleCancel(d._id)}
                          disabled={cancelling === d._id}
                        >
                          {cancelling === d._id ? '…' : 'Cancel'}
                        </button>
                      )}
                      {canRate && (
                        alreadyRated
                          ? <span className="os-rated-badge">⭐ Rated</span>
                          : <button className="os-rate-btn" onClick={() => setRatingDelivery({ id: d._id })}>⭐ Rate</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="os-pagination">
          <button className="os-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Précédent
          </button>
          <span className="os-page-info">Page {page} / {totalPages}</span>
          <button className="os-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Suivant →
          </button>
        </div>
      )}

      {/* Rating modal */}
      {ratingDelivery && (
        <RatingModal
          deliveryId={ratingDelivery.id}
          driverName={ratingDelivery.driverName}
          onClose={() => setRatingDelivery(null)}
        />
      )}
    </div>
  );
};

export default OrdersPage;
