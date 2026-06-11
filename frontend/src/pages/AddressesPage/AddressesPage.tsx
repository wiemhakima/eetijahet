import React, { useEffect, useState } from 'react';
import { Marker, useMapEvents } from 'react-leaflet';
import ArmadaMap, { makePickupPin } from '../../components/ArmadaMap';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAddresses, createAddress, updateAddress, deleteAddress } from '../../store/slices/addressSlice';
import type { FavoriteAddress } from '../../store/slices/addressSlice';
import BaseModal from '../../components/ui/BaseModal/BaseModal';
import './AddressesPage.scss';

const pinIcon = makePickupPin();

interface LatLon { lat: number; lng: number }

const MapClickHandler: React.FC<{ active: boolean; onPick: (ll: LatLon) => void }> = ({ active, onPick }) => {
  useMapEvents({ click(e) { if (active) onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
};

const EMPTY_FORM = { label: '', street: '', city: '', lat: 0, lng: 0, isDefault: false };

const PinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const AddressesPage: React.FC = () => {
  const dispatch  = useAppDispatch();
  const { addresses: rawAddresses, isLoading, isSaving, error } = useAppSelector(s => s.address);
  const addresses = Array.isArray(rawAddresses) ? rawAddresses : [];

  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<FavoriteAddress | null>(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [pickMode,   setPickMode]   = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => { dispatch(fetchAddresses()); }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setLocalError(null);
    setShowForm(true);
  };

  const openEdit = (addr: FavoriteAddress) => {
    setEditing(addr);
    setForm({ label: addr.label, street: addr.street || '', city: addr.city || '', lat: addr.lat, lng: addr.lng, isDefault: addr.isDefault });
    setLocalError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) return setLocalError('Le libellé est obligatoire.');
    if (!form.lat || !form.lng) return setLocalError('Cliquez sur la carte pour choisir la position.');
    setLocalError(null);

    let result;
    if (editing) {
      result = await dispatch(updateAddress({ id: editing._id, data: form }));
    } else {
      result = await dispatch(createAddress(form));
    }
    if (!createAddress.rejected.match(result) && !updateAddress.rejected.match(result)) {
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette adresse ?')) return;
    setDeleting(id);
    await dispatch(deleteAddress(id));
    setDeleting(null);
  };

  const mapBounds: [[number,number],[number,number]] | undefined =
    form.lat && form.lng
      ? [[form.lat - 0.02, form.lng - 0.02], [form.lat + 0.02, form.lng + 0.02]]
      : undefined;

  return (
    <div className="addresses-page">
      <div className="ap-header">
        <div>
          <h2 className="ap-header__title">Adresses favorites</h2>
          <p className="ap-header__desc">Enregistrez vos adresses fréquentes pour les réutiliser facilement.</p>
        </div>
        <button className="ap-btn-primary" onClick={openCreate}>+ Ajouter une adresse</button>
      </div>

      {error && <div className="ap-alert">{error}</div>}

      {isLoading && !addresses.length ? (
        <div className="ap-loading">Chargement…</div>
      ) : addresses.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty__icon">⭐</div>
          <p>Vous n'avez pas encore d'adresses favorites.</p>
          <button className="ap-btn-primary" onClick={openCreate}>Ajouter ma première adresse</button>
        </div>
      ) : (
        <div className="ap-grid">
          {addresses.map(addr => (
            <div key={addr._id} className={`ap-card ${addr.isDefault ? 'ap-card--default' : ''}`}>
              {addr.isDefault && <span className="ap-default-badge">Défaut</span>}
              <div className="ap-card__pin">📍</div>
              <div className="ap-card__info">
                <div className="ap-card__label">{addr.label}</div>
                {addr.street && <div className="ap-card__detail">{addr.street}</div>}
                {addr.city && <div className="ap-card__detail">{addr.city}</div>}
                <div className="ap-card__coords">{addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}</div>
              </div>
              <div className="ap-card__actions">
                <button className="ap-edit-btn" onClick={() => openEdit(addr)}>Modifier</button>
                <button className="ap-delete-btn" onClick={() => handleDelete(addr._id)} disabled={deleting === addr._id}>
                  {deleting === addr._id ? '…' : 'Supprimer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Address Form Modal ── */}
      <BaseModal
        show={showForm}
        onClose={() => setShowForm(false)}
        icon={<PinIcon />}
        title={editing ? "Modifier l'adresse" : 'Ajouter une adresse'}
        subtitle={editing ? editing.label : 'Renseignez les informations et positionnez sur la carte'}
        maxWidth="520px"
        footer={
          <>
            <button className="bm-btn bm-btn--cancel" onClick={() => setShowForm(false)}>Annuler</button>
            <button className="bm-btn bm-btn--primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </>
        }
      >
        <div className="ap-form-row">
          <label className="ap-label">Libellé *</label>
          <input className="ap-input" placeholder="Maison, Bureau, Gym…" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
        </div>
        <div className="ap-form-row">
          <label className="ap-label">Rue / Bloc</label>
          <input className="ap-input" placeholder="Ex: Block 4, Street 12" value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} />
        </div>
        <div className="ap-form-row">
          <label className="ap-label">Ville</label>
          <input className="ap-input" placeholder="Ex: Salmiya" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        </div>
        <div className="ap-form-row ap-form-row--checkbox">
          <label className="ap-checkbox">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
            <span>Définir comme adresse par défaut</span>
          </label>
        </div>

        <div className="ap-form-row">
          <div className="ap-map-header">
            <label className="ap-label">Position sur la carte</label>
            <button
              className={`ap-pick-btn ${pickMode ? 'ap-pick-btn--active' : ''}`}
              type="button"
              onClick={() => setPickMode(m => !m)}
            >
              {pickMode ? '✕ Annuler' : '📍 Cliquer sur la carte'}
            </button>
          </div>
          {form.lat !== 0 && (
            <div className="ap-coords-display">{form.lat.toFixed(5)}, {form.lng.toFixed(5)}</div>
          )}
          <div className="ap-modal-map">
            <ArmadaMap height="220px" style={{ cursor: pickMode ? 'crosshair' : 'grab' }} bounds={mapBounds} boundsPadding={30}>
              <MapClickHandler active={pickMode} onPick={ll => { setForm(f => ({ ...f, lat: ll.lat, lng: ll.lng })); setPickMode(false); }} />
              {form.lat !== 0 && <Marker position={[form.lat, form.lng]} icon={pinIcon} />}
            </ArmadaMap>
          </div>
        </div>

        {localError && <div className="ap-alert" style={{ marginTop: 8 }}>{localError}</div>}
      </BaseModal>
    </div>
  );
};

export default AddressesPage;
