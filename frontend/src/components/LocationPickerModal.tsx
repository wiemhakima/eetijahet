import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import ArmadaMap, { makeDeliveryPin } from './ArmadaMap';
import BaseModal from './ui/BaseModal/BaseModal';

interface LocationData {
  lat: number;
  lng: number;
  display_name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const KUWAIT_CENTER: [number, number] = [29.3759, 47.9774];
const markerIcon = makeDeliveryPin();

const PinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const LocationPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
}) => {
  const [searchQuery, setSearchQuery]         = useState('');
  const [suggestions, setSuggestions]         = useState<LocationData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selected, setSelected]               = useState<LocationData | null>(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng, display_name: `${initialLat.toFixed(5)}, ${initialLng.toFixed(5)}` }
      : null,
  );

  const searchLocation = async (query: string) => {
    if (query.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=kw&limit=10&addressdetails=1`,
      );
      const data = await res.json();
      const results: LocationData[] = data
        .filter((item: { lat: string; lon: string; display_name: string }) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          return lat >= 28.5 && lat <= 30.1 && lng >= 46.5 && lng <= 48.5;
        })
        .map((item: { lat: string; lon: string; display_name: string }) => ({
          lat:          parseFloat(item.lat),
          lng:          parseFloat(item.lon),
          display_name: item.display_name,
        }))
        .slice(0, 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch { /* network error */ }
  };

  const pickSuggestion = (s: LocationData) => {
    setSelected(s);
    setSearchQuery(s.display_name);
    setShowSuggestions(false);
  };

  const handleMapClick = (e: { latlng: { lat: number; lng: number } }) => {
    const { lat, lng } = e.latlng;
    const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setSelected({ lat, lng, display_name: label });
    setSearchQuery(label);
    setShowSuggestions(false);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected.lat, selected.lng, selected.display_name);
    onClose();
  };

  return (
    <BaseModal
      show={isOpen}
      onClose={onClose}
      title="Choisir la localisation"
      subtitle="Recherchez ou cliquez sur la carte"
      icon={<PinIcon />}
      maxWidth="700px"
      footer={
        <>
          <button className="bm-btn bm-btn--cancel" onClick={onClose}>Annuler</button>
          <button
            className="bm-btn bm-btn--primary"
            disabled={!selected}
            onClick={handleConfirm}
          >
            ✓ Confirmer la localisation
          </button>
        </>
      }
    >
      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '9px 12px', border: '1.5px solid #d1d5db',
            borderRadius: 9, fontSize: 13, outline: 'none', color: '#16191f',
          }}
          type="text"
          placeholder="Rechercher une adresse au Kuwait..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); searchLocation(e.target.value); }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2,
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)',
            zIndex: 9999, overflow: 'hidden',
          }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                  fontSize: 13, color: '#334155',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                onClick={() => pickSuggestion(s)}
              >
                📍 {s.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ height: 360, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
        <ArmadaMap
          center={selected ? [selected.lat, selected.lng] : KUWAIT_CENTER}
          zoom={selected ? 14 : 10}
          height="100%"
          onClick={handleMapClick}
        >
          {selected && (
            <Marker position={[selected.lat, selected.lng]} icon={markerIcon}>
              <Popup>Position sélectionnée</Popup>
            </Marker>
          )}
        </ArmadaMap>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: '8px 0 0' }}>
        Recherchez une adresse ou cliquez directement sur la carte pour placer le marqueur
      </p>
    </BaseModal>
  );
};

export default LocationPickerModal;
