import 'leaflet/dist/leaflet.css';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import i18n from '../../../i18n';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import { useAdminDeliveriesController } from '../../../controllers/useAdminDeliveriesController';
import type { AdminDelivery, AdminDeliveryStatus } from '../../../models/AdminModel';
import BaseModal from '../../../components/ui/BaseModal/BaseModal';
import './AdminOrders.scss';

// ─── Leaflet default icon fix ─────────────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pickupIcon = L.divIcon({
  className: '',
  html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35))">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174L12 36l4.373-12.826C20.837 21.426 24 17.084 24 12 24 5.373 18.627 0 12 0z" fill="#34a853" stroke="#2a7a40" stroke-width=".6"/>
    <circle cx="12" cy="12" r="5.5" fill="white" opacity=".93"/><circle cx="12" cy="12" r="2.8" fill="#34a853"/>
  </svg>`,
  iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -38],
});

const dropoffIcon = L.divIcon({
  className: '',
  html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35))">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174L12 36l4.373-12.826C20.837 21.426 24 17.084 24 12 24 5.373 18.627 0 12 0z" fill="#ea4335" stroke="#bf2a1e" stroke-width=".6"/>
    <circle cx="12" cy="12" r="5.5" fill="white" opacity=".93"/><circle cx="12" cy="12" r="2.8" fill="#ea4335"/>
  </svg>`,
  iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -38],
});

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<AdminDeliveryStatus, { label: string; cls: string }> = {
  pending:    { label: 'En attente',     cls: 'badge--pending'    },
  accepted:   { label: 'Acceptée',       cls: 'badge--accepted'   },
  picked_up:  { label: 'Colis récupéré', cls: 'badge--picked'     },
  in_transit: { label: 'En livraison',   cls: 'badge--transit'    },
  delivered:  { label: 'Livrée',         cls: 'badge--delivered'  },
  cancelled:  { label: 'Annulée',        cls: 'badge--cancelled'  },
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '',           label: 'Tous les statuts' },
  { value: 'pending',    label: 'En attente'       },
  { value: 'accepted',   label: 'Acceptée'         },
  { value: 'picked_up',  label: 'Colis récupéré'   },
  { value: 'in_transit', label: 'En livraison'     },
  { value: 'delivered',  label: 'Livrée'           },
  { value: 'cancelled',  label: 'Annulée'          },
];

const PKG_LABELS: Record<string, string> = {
  document: 'Document', small: 'Petit', medium: 'Moyen',
  large: 'Grand', fragile: 'Fragile', food: 'Alimentation',
};

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDT = (n?: number) => n != null ? `${n.toFixed(3)} KWD` : '—';
const clientName = (d: AdminDelivery) =>
  d.client ? `${d.client.firstName} ${d.client.lastName}` : '—';
const driverName = (d: AdminDelivery) =>
  d.driver ? `${d.driver.firstName} ${d.driver.lastName}` : null;

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const EditIconLg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: AdminDeliveryStatus }> = ({ status }) => {
  const cfg = STATUS_CFG[status] || { label: status, cls: '' };
  return <span className={`ao-badge ${cfg.cls}`}>{cfg.label}</span>;
};

// ─── Delivery map (Leaflet) ───────────────────────────────────────────────────

const DeliveryMap: React.FC<{ delivery: AdminDelivery }> = ({ delivery }) => {
  const hasPickup  = delivery.pickupLat  != null && delivery.pickupLng  != null;
  const hasDropoff = delivery.dropoffLat != null && delivery.dropoffLng != null;

  if (!hasPickup && !hasDropoff) {
    return <div className="ao-map-placeholder"><p>Aucune coordonnée GPS disponible pour cette commande.</p></div>;
  }

  const center: [number, number] = hasPickup
    ? [delivery.pickupLat!, delivery.pickupLng!]
    : [delivery.dropoffLat!, delivery.dropoffLng!];

  const line: [number, number][] = [];
  if (hasPickup)  line.push([delivery.pickupLat!,  delivery.pickupLng!]);
  if (hasDropoff) line.push([delivery.dropoffLat!, delivery.dropoffLng!]);

  return (
    <MapContainer center={center} zoom={13} className="ao-leaflet-map" scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {hasPickup && (
        <Marker position={[delivery.pickupLat!, delivery.pickupLng!]} icon={pickupIcon}>
          <Popup><strong>Départ</strong><br />{delivery.pickupLabel || `${delivery.pickupLat?.toFixed(4)}, ${delivery.pickupLng?.toFixed(4)}`}</Popup>
        </Marker>
      )}
      {hasDropoff && (
        <Marker position={[delivery.dropoffLat!, delivery.dropoffLng!]} icon={dropoffIcon}>
          <Popup><strong>Destination</strong><br />{delivery.dropoffLabel || `${delivery.dropoffLat?.toFixed(4)}, ${delivery.dropoffLng?.toFixed(4)}`}</Popup>
        </Marker>
      )}
      {line.length === 2 && <Polyline positions={line} color="#1a73e8" weight={3} dashArray="6 4" opacity={0.8} />}
    </MapContainer>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  delivery: AdminDelivery;
  onClose: () => void;
  onEdit: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ delivery, onClose, onEdit }) => (
  <BaseModal
    show={true}
    onClose={onClose}
    icon={<EyeIcon />}
    title="Détails commande"
    subtitle={delivery.orderId || delivery._id.slice(-8)}
    maxWidth="720px"
    footer={
      <>
        <button className="bm-btn bm-btn--cancel" onClick={onClose}>Fermer</button>
        <button className="bm-btn bm-btn--primary" onClick={onEdit}>Modifier</button>
      </>
    }
  >
    <DeliveryMap delivery={delivery} />
    <div className="ao-detail-grid" style={{ marginTop: 16 }}>
      <section className="ao-detail-sec">
        <h3>Client</h3>
        <p><span>Nom</span><strong>{clientName(delivery)}</strong></p>
        <p><span>Email</span><strong>{delivery.client?.email || '—'}</strong></p>
      </section>
      <section className="ao-detail-sec">
        <h3>Trajet</h3>
        <p><span>Départ</span><strong>{delivery.pickupLabel || '—'}</strong></p>
        <p><span>Destination</span><strong>{delivery.dropoffLabel || '—'}</strong></p>
        <p><span>Distance</span><strong>{delivery.distance_km ? `${delivery.distance_km} km` : '—'}</strong></p>
        <p><span>ETA</span><strong>{delivery.eta_minutes ? `${Math.round(delivery.eta_minutes)} min` : '—'}</strong></p>
      </section>
      <section className="ao-detail-sec">
        <h3>Colis</h3>
        <p><span>Type</span><strong>{PKG_LABELS[delivery.packageType || ''] || delivery.packageType || '—'}</strong></p>
        <p><span>Prix estimé</span><strong>{fmtDT(delivery.estimatedPrice)}</strong></p>
        <p><span>Date</span><strong>{fmt(delivery.createdAt)}</strong></p>
        {delivery.notes && <p><span>Notes</span><strong>{delivery.notes}</strong></p>}
      </section>
      <section className="ao-detail-sec">
        <h3>Statut</h3>
        <p><span>Statut</span><StatusBadge status={delivery.clientStatus} /></p>
        <p><span>Livreur</span><strong>{driverName(delivery) || '— non assigné'}</strong></p>
        {delivery.completed_at && <p><span>Livré le</span><strong>{fmt(delivery.completed_at)}</strong></p>}
      </section>
    </div>
  </BaseModal>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  delivery: AdminDelivery;
  onClose: () => void;
  onSave: (status: AdminDeliveryStatus) => void;
  isSaving: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ delivery, onClose, onSave, isSaving }) => {
  const [status, setStatus] = useState<AdminDeliveryStatus>(delivery.clientStatus);

  return (
    <BaseModal
      show={true}
      onClose={onClose}
      icon={<EditIconLg />}
      title="Modifier la commande"
      subtitle={delivery.orderId || delivery._id.slice(-8)}
      maxWidth="420px"
      footer={
        <>
          <button className="bm-btn bm-btn--cancel" onClick={onClose} disabled={isSaving}>Annuler</button>
          <button className="bm-btn bm-btn--primary" disabled={isSaving} onClick={() => onSave(status)}>
            {isSaving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <div className="ao-form-group">
        <label className="ao-form-label">Statut</label>
        <select
          className="ao-form-select"
          value={status}
          onChange={e => setStatus(e.target.value as AdminDeliveryStatus)}
        >
          {STATUS_OPTIONS.filter(o => o.value).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </BaseModal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SOCKET_URL = (import.meta.env.VITE_API_URL as string || 'http://localhost:3000/api')
  .replace('/api', '');

const AdminOrders: React.FC = () => {
  const ctrl = useAdminDeliveriesController();
  const { deliveries, deliveryStats: stats, pagination, isLoading, error } = ctrl;

  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [date,      setDate]      = useState('');
  const [page,      setPage]      = useState(1);

  const [detailDelivery, setDetailDelivery] = useState<AdminDelivery | null>(null);
  const [editDelivery,   setEditDelivery]   = useState<AdminDelivery | null>(null);
  const [isSaving,       setIsSaving]       = useState(false);
  const [newCount,       setNewCount]       = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const load = useCallback(() => {
    ctrl.loadDeliveries({ page, limit: PAGE_SIZE, status: status || undefined, search: search || undefined, date: date || undefined });
    ctrl.loadStats();
  }, [page, status, search, date]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const sock = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = sock;
    sock.on('delivery:new', (delivery: AdminDelivery) => { ctrl.pushDelivery(delivery); setNewCount(n => n + 1); });
    sock.on('delivery:updated', (delivery: AdminDelivery) => {
      ctrl.patchDelivery(delivery);
      setDetailDelivery(prev => prev?._id === delivery._id ? delivery : prev);
    });
    return () => { sock.disconnect(); };
  }, []);

  const resetFilters = () => { setSearch(''); setStatus(''); setDate(''); setPage(1); };

  const handleSave = async (newStatus: AdminDeliveryStatus) => {
    if (!editDelivery) return;
    setIsSaving(true);
    await ctrl.updateDelivery(editDelivery._id, { status: newStatus });
    setIsSaving(false);
    setEditDelivery(null);
    setDetailDelivery(null);
    ctrl.loadStats();
  };

  const openEdit = (d: AdminDelivery) => {
    setDetailDelivery(null);
    setEditDelivery(d);
  };

  const totalPages = pagination ? Math.ceil(pagination.total / PAGE_SIZE) : 1;

  return (
    <div className="admin-orders">
      <div className="ao-page-hd">
        <div>
          <h1 className="ao-page-hd__title">Toutes les commandes</h1>
          <p className="ao-page-hd__sub">Supervision en temps réel des livraisons</p>
        </div>
        <div className="ao-page-hd__actions">
          {newCount > 0 && (
            <span className="ao-live-badge">
              <span className="ao-live-dot" />
              {newCount} nouvelle{newCount > 1 ? 's' : ''}
            </span>
          )}
          <button className="ao-btn ao-btn--ghost" onClick={() => { load(); setNewCount(0); }}>
            <RefreshIcon /> Actualiser
          </button>
        </div>
      </div>

      <div className="ao-stats">
        <div className="ao-stat ao-stat--blue"><span className="ao-stat__lbl">Total</span><span className="ao-stat__val">{stats?.total ?? '—'}</span></div>
        <div className="ao-stat ao-stat--orange"><span className="ao-stat__lbl">En attente</span><span className="ao-stat__val">{stats?.pending ?? '—'}</span></div>
        <div className="ao-stat ao-stat--purple"><span className="ao-stat__lbl">En livraison</span><span className="ao-stat__val">{stats?.delivering ?? '—'}</span></div>
        <div className="ao-stat ao-stat--green"><span className="ao-stat__lbl">Livrées</span><span className="ao-stat__val">{stats?.delivered ?? '—'}</span></div>
        <div className="ao-stat ao-stat--teal"><span className="ao-stat__lbl">Revenu total</span><span className="ao-stat__val ao-stat__val--sm">{stats?.revenue != null ? fmtDT(stats.revenue) : '—'}</span></div>
      </div>

      <div className="ao-filters">
        <div className="ao-search">
          <SearchIcon />
          <input className="ao-search__input" placeholder="Rechercher ID, client, email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="ao-sel" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input type="date" className="ao-sel" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} />
        {(search || status || date) && <button className="ao-btn ao-btn--ghost" onClick={resetFilters}>Réinitialiser</button>}
      </div>

      {error && <div className="ao-alert">{error}</div>}

      <div className="ao-table-wrap">
        {isLoading ? (
          <div className="ao-loading"><span className="ao-spinner" />Chargement des commandes…</div>
        ) : deliveries.length === 0 ? (
          <div className="ao-empty">Aucune commande ne correspond aux critères.</div>
        ) : (
          <table className="ao-table">
            <thead>
              <tr><th>ID</th><th>Client</th><th>Date</th><th>Colis</th><th>Distance</th><th>Prix</th><th>Livreur</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {deliveries.map(d => (
                <tr key={d._id}>
                  <td className="ao-td-id">{d.orderId || d._id.slice(-8)}</td>
                  <td>
                    <div className="ao-client">
                      <span className="ao-client__name">{clientName(d)}</span>
                      <span className="ao-client__email">{d.client?.email || ''}</span>
                    </div>
                  </td>
                  <td className="ao-td-date">{fmt(d.createdAt)}</td>
                  <td>{PKG_LABELS[d.packageType || ''] || d.packageType || '—'}</td>
                  <td>{d.distance_km ? `${d.distance_km} km` : '—'}</td>
                  <td className="ao-td-price">{fmtDT(d.estimatedPrice)}</td>
                  <td>{driverName(d) ? <span className="ao-driver">{driverName(d)}</span> : <span className="ao-unassigned">Non assigné</span>}</td>
                  <td><StatusBadge status={d.clientStatus} /></td>
                  <td>
                    <div className="ao-actions">
                      <button className="ao-act-btn ao-act-btn--view" title="Voir détails" onClick={() => setDetailDelivery(d)}><EyeIcon /></button>
                      <button className="ao-act-btn ao-act-btn--edit" title="Modifier" onClick={() => openEdit(d)}><EditIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="ao-pager">
          <span className="ao-pager__info">{pagination?.total ?? 0} commande{(pagination?.total ?? 0) !== 1 ? 's' : ''} — page {page}/{totalPages}</span>
          <div className="ao-pager__btns">
            <button className="ao-pg" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Préc.</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
              .reduce<(number | '…')[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…');
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} className="ao-pg-ellipsis">…</span>
                  : <button key={n} className={`ao-pg ao-pg--num ${n === page ? 'ao-pg--active' : ''}`} onClick={() => setPage(n as number)}>{n}</button>
              )}
            <button className="ao-pg" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suiv. →</button>
          </div>
        </div>
      )}

      {detailDelivery && (
        <DetailModal delivery={detailDelivery} onClose={() => setDetailDelivery(null)} onEdit={() => openEdit(detailDelivery)} />
      )}
      {editDelivery && (
        <EditModal delivery={editDelivery} onClose={() => setEditDelivery(null)} onSave={handleSave} isSaving={isSaving} />
      )}
    </div>
  );
};

export default AdminOrders;
