import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Marker, useMapEvents } from 'react-leaflet';
import ArmadaMap, { makePickupPin, makeDeliveryPin } from '../../components/ArmadaMap';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { estimateDelivery, createDelivery, clearEstimate } from '../../store/slices/deliverySlice';
import './NewDelivery.scss';

// ─── Icons ────────────────────────────────────────────────────────────────────
const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const PackageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);
const ZapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><polyline points="12,5 19,12 12,19"/>
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><polyline points="12,19 5,12 12,5"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface LatLon { lat: number; lon: number }

const PACKAGE_TYPES = [
  { value: 'document', label: 'Document / Enveloppe', icon: '📄' },
  { value: 'small',    label: 'Petit colis < 5 kg',   icon: '📦' },
  { value: 'medium',   label: 'Colis moyen 5–20 kg',  icon: '🗃️' },
  { value: 'large',    label: 'Grand colis > 20 kg',  icon: '📫' },
  { value: 'fragile',  label: 'Fragile',               icon: '🪬' },
  { value: 'food',     label: 'Alimentation',          icon: '🍱' },
];

const STEPS = ['Départ', 'Destination', 'Détails', 'Confirmation'];

// ─── Map click handler ────────────────────────────────────────────────────────
const MapClickHandler: React.FC<{ active: boolean; onPick: (ll: LatLon) => void }> = ({ active, onPick }) => {
  useMapEvents({ click(e) { if (active) onPick({ lat: e.latlng.lat, lon: e.latlng.lng }); } });
  return null;
};

const pickupIcon  = makePickupPin();
const dropoffIcon = makeDeliveryPin();

// ─── Component ────────────────────────────────────────────────────────────────
const NewDelivery: React.FC = () => {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const { estimate, isEstimating, isCreating, error } = useAppSelector(s => s.delivery);

  const [step,        setStep]        = useState(0); // 0-3
  const [pickup,      setPickup]      = useState<LatLon | null>(null);
  const [dropoff,     setDropoff]     = useState<LatLon | null>(null);
  const [pickupLabel, setPickupLabel] = useState('');
  const [dropoffLabel,setDropoffLabel]= useState('');
  const [packageType, setPackageType] = useState('small');
  const [notes,       setNotes]       = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [localError,  setLocalError]  = useState<string | null>(null);
  const [confirmed,   setConfirmed]   = useState(false);

  const bounds: [[number, number],[number,number]] | undefined =
    pickup && dropoff
      ? [[Math.min(pickup.lat,dropoff.lat)-0.02, Math.min(pickup.lon,dropoff.lon)-0.02],
         [Math.max(pickup.lat,dropoff.lat)+0.02, Math.max(pickup.lon,dropoff.lon)+0.02]]
      : undefined;

  const goNext = async () => {
    setLocalError(null);
    if (step === 0) {
      if (!pickup) return setLocalError('Cliquez sur la carte pour sélectionner le point de départ.');
      setStep(1);
    } else if (step === 1) {
      if (!dropoff) return setLocalError('Cliquez sur la carte pour sélectionner la destination.');
      // Auto-estimate when moving to confirmation step (step 3)
      setStep(2);
    } else if (step === 2) {
      // Fetch estimate then go to step 3
      dispatch(clearEstimate());
      const result = await dispatch(estimateDelivery({
        pickupLat: pickup!.lat, pickupLng: pickup!.lon,
        dropoffLat: dropoff!.lat, dropoffLng: dropoff!.lon,
      }));
      if (estimateDelivery.rejected.match(result)) {
        setLocalError((result.payload as string) || 'Estimation échouée');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Create the delivery
      const result = await dispatch(createDelivery({
        pickupLat: pickup!.lat, pickupLng: pickup!.lon, pickupLabel,
        dropoffLat: dropoff!.lat, dropoffLng: dropoff!.lon, dropoffLabel,
        packageType: packageType as never,
        notes,
        desiredDate: desiredDate || undefined,
        estimatedPrice: estimate?.estimatedPrice,
        distance_km: estimate?.distance_km,
        eta_minutes: estimate?.eta_minutes,
      }));
      if (createDelivery.rejected.match(result)) {
        setLocalError((result.payload as string) || 'Erreur lors de la création');
        return;
      }
      setConfirmed(true);
    }
  };

  const goPrev = () => {
    setLocalError(null);
    setStep(s => Math.max(0, s - 1));
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="new-delivery nd-success">
        <div className="nd-success-card">
          <div className="nd-success-icon">✅</div>
          <h2>Commande créée !</h2>
          <p>Votre demande de livraison a été envoyée avec succès.</p>
          <div className="nd-success-actions">
            <button className="nd-btn-primary" onClick={() => navigate('/dashboard/tracking')}>
              Voir mes commandes
            </button>
            <button className="nd-btn-outline" onClick={() => { dispatch(clearEstimate()); setStep(0); setPickup(null); setDropoff(null); setConfirmed(false); }}>
              Nouvelle livraison
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Map cursor ──────────────────────────────────────────────────────────────
  const mapActive = step === 0 || step === 1;

  return (
    <div className="new-delivery">
      {/* ── Left: Form ── */}
      <div className="nd-form-panel">
        {/* Stepper */}
        <div className="nd-stepper">
          {STEPS.map((label, i) => (
            <div key={i} className={`nd-step ${i === step ? 'nd-step--active' : ''} ${i < step ? 'nd-step--done' : ''}`}>
              <div className="nd-step__circle">
                {i < step ? <CheckIcon /> : i + 1}
              </div>
              <span className="nd-step__label">{label}</span>
              {i < STEPS.length - 1 && <div className="nd-step__line" />}
            </div>
          ))}
        </div>

        <div className="nd-form-panel__header">
          <h2 className="nd-form-panel__title">
            {step === 0 && 'Point de départ'}
            {step === 1 && 'Destination'}
            {step === 2 && 'Détails du colis'}
            {step === 3 && 'Récapitulatif'}
          </h2>
          <p className="nd-form-panel__desc">
            {step === 0 && 'Cliquez sur la carte pour placer le point de départ.'}
            {step === 1 && 'Cliquez sur la carte pour placer la destination.'}
            {step === 2 && 'Décrivez votre colis et ajoutez des instructions.'}
            {step === 3 && 'Vérifiez les informations et confirmez votre commande.'}
          </p>
        </div>

        {/* ── Step 0: Pickup ── */}
        {step === 0 && (
          <div className="nd-section">
            <div className={`nd-pin-preview ${pickup ? 'nd-pin-preview--set' : 'nd-pin-preview--waiting'}`}>
              <span className="nd-pin-dot nd-pin-dot--green" />
              <div>
                <div className="nd-pin-label">Point de départ</div>
                <div className="nd-pin-value">
                  {pickup ? `${pickup.lat.toFixed(5)}, ${pickup.lon.toFixed(5)}` : '👆 Cliquez sur la carte'}
                </div>
              </div>
            </div>
            {pickup && (
              <div className="nd-section" style={{ marginTop: 16 }}>
                <label className="nd-label">Nom du lieu (optionnel)</label>
                <input className="nd-input" placeholder="Ex: Salmiya, Block 4" value={pickupLabel} onChange={e => setPickupLabel(e.target.value)} />
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Dropoff ── */}
        {step === 1 && (
          <div className="nd-section">
            <div className={`nd-pin-preview ${dropoff ? 'nd-pin-preview--set' : 'nd-pin-preview--waiting'}`}>
              <span className="nd-pin-dot nd-pin-dot--red" />
              <div>
                <div className="nd-pin-label">Destination</div>
                <div className="nd-pin-value">
                  {dropoff ? `${dropoff.lat.toFixed(5)}, ${dropoff.lon.toFixed(5)}` : '👆 Cliquez sur la carte'}
                </div>
              </div>
            </div>
            {dropoff && (
              <div className="nd-section" style={{ marginTop: 16 }}>
                <label className="nd-label">Nom du lieu (optionnel)</label>
                <input className="nd-input" placeholder="Ex: Kuwait City, Sharq" value={dropoffLabel} onChange={e => setDropoffLabel(e.target.value)} />
              </div>
            )}
            {/* Summary of pickup */}
            <div className="nd-summary-row">
              <span className="nd-pin-dot nd-pin-dot--green nd-pin-dot--sm" />
              <span className="nd-summary-text">{pickupLabel || (pickup ? `${pickup.lat.toFixed(4)}, ${pickup.lon.toFixed(4)}` : '—')}</span>
            </div>
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && (
          <div className="nd-section">
            <label className="nd-label"><PackageIcon /> Type de colis</label>
            <div className="nd-package-grid">
              {PACKAGE_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`nd-package-card ${packageType === t.value ? 'nd-package-card--active' : ''}`}
                  onClick={() => setPackageType(t.value)}
                >
                  <span className="nd-package-card__icon">{t.icon}</span>
                  <span className="nd-package-card__label">{t.label}</span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <label className="nd-label">Date souhaitée (optionnel)</label>
              <input className="nd-input" type="date" value={desiredDate} onChange={e => setDesiredDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label className="nd-label">Instructions spéciales (optionnel)</label>
              <textarea className="nd-textarea" rows={3} placeholder="Ex: Fragile, appeler avant livraison…" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Step 3: Recap ── */}
        {step === 3 && estimate && (
          <div className="nd-recap">
            <div className="nd-recap__row">
              <span className="nd-pin-dot nd-pin-dot--green" />
              <div>
                <div className="nd-recap__label">Départ</div>
                <div className="nd-recap__val">{pickupLabel || `${pickup?.lat.toFixed(4)}, ${pickup?.lon.toFixed(4)}`}</div>
              </div>
            </div>
            <div className="nd-recap__connector" />
            <div className="nd-recap__row">
              <span className="nd-pin-dot nd-pin-dot--red" />
              <div>
                <div className="nd-recap__label">Destination</div>
                <div className="nd-recap__val">{dropoffLabel || `${dropoff?.lat.toFixed(4)}, ${dropoff?.lon.toFixed(4)}`}</div>
              </div>
            </div>

            <div className="nd-recap__stats">
              <div className="nd-recap__stat">
                <div className="nd-recap__stat-label">Distance</div>
                <div className="nd-recap__stat-val">{estimate.distance_km} km</div>
              </div>
              <div className="nd-recap__stat">
                <div className="nd-recap__stat-label">Durée estimée</div>
                <div className="nd-recap__stat-val">{estimate.eta_minutes} min</div>
              </div>
              <div className="nd-recap__stat">
                <div className="nd-recap__stat-label">Type de colis</div>
                <div className="nd-recap__stat-val">{PACKAGE_TYPES.find(t => t.value === packageType)?.label}</div>
              </div>
            </div>

            <div className="nd-recap__price">
              <span>Prix estimé</span>
              <span className="nd-recap__price-val">{estimate.estimatedPrice.toFixed(3)} KWD</span>
            </div>
            {estimate.fallback && (
              <p className="nd-hint" style={{ marginTop: 8 }}>⚠️ Estimation basée sur la distance directe (moteur de routage indisponible).</p>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {(localError || error) && (
          <div className="nd-alert nd-alert--error">{localError || error}</div>
        )}

        {/* ── Actions ── */}
        <div className="nd-actions">
          {step > 0 && (
            <button className="nd-btn-outline" onClick={goPrev} disabled={isEstimating || isCreating}>
              <ArrowLeftIcon /> Retour
            </button>
          )}
          <button className="nd-btn-primary nd-btn-primary--flex" onClick={goNext} disabled={isEstimating || isCreating}>
            {(isEstimating || isCreating) ? <span className="nd-spinner" /> : null}
            {step === 3
              ? isCreating ? 'Création…' : <><CheckIcon /> Confirmer la commande</>
              : step === 2
              ? isEstimating ? 'Calcul…' : <><ZapIcon /> Estimer & Continuer</>
              : <><ArrowRightIcon /> Continuer</>}
          </button>
        </div>
      </div>

      {/* ── Right: Map ── */}
      <div className="nd-map-panel">
        {mapActive && (
          <div className="nd-map-hint">
            {step === 0 ? '📍 Cliquez pour définir le point de départ' : '📍 Cliquez pour définir la destination'}
          </div>
        )}
        <ArmadaMap
          height="100%"
          style={{ cursor: mapActive ? 'crosshair' : 'grab' }}
          bounds={bounds}
          boundsPadding={50}
        >
          <MapClickHandler
            active={mapActive}
            onPick={ll => { if (step === 0) setPickup(ll); else if (step === 1) setDropoff(ll); }}
          />
          {pickup  && <Marker position={[pickup.lat,  pickup.lon]}  icon={pickupIcon} />}
          {dropoff && <Marker position={[dropoff.lat, dropoff.lon]} icon={dropoffIcon} />}
        </ArmadaMap>
      </div>
    </div>
  );
};

export default NewDelivery;
