import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import ArmadaMap, { makePickupPin, makeDeliveryPin } from '../ArmadaMap';
import { useAppSelector } from '../../store/hooks';
import api from '../../api';

// ─── Constants ────────────────────────────────────────────────────────────────

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || (import.meta.env.VITE_API_URL?.replace('/api', ''))
  || 'http://localhost:3000';

const DEFAULT_CENTER: [number, number] = [29.3759, 47.9774]; // Kuwait City

// ─── Nominatim geocoding ──────────────────────────────────────────────────────

const geocodeCache = new Map<string, [number, number] | null>();
let lastGeocodedAt = 0;

async function geocodeAddress(address: string, city?: string): Promise<[number, number] | null> {
  const query = [address, city, 'Kuwait'].filter(Boolean).join(', ');
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;

  const wait = 1100 - (Date.now() - lastGeocodedAt);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastGeocodedAt = Date.now();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'fr,en' } },
    );
    const json = await res.json();
    if (json?.[0]) {
      const coords: [number, number] = [parseFloat(json[0].lat), parseFloat(json[0].lon)];
      geocodeCache.set(query, coords);
      return coords;
    }
    geocodeCache.set(query, null);
    return null;
  } catch {
    geocodeCache.set(query, null);
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriverInfo {
  _id?:    string;
  name:    string;
  phone?:  string | null;
  avatar?: string;
  status?: string;
  lat:     number | null;
  lng:     number | null;
}

interface ActiveDelivery {
  _id:          string;
  orderId?:     string;
  status:       string;
  clientStatus?: string;
  source?:      string;
  completed?:   boolean;
  driver:       DriverInfo | null;
  pickup:  { address: string; label: string; city?: string; lat: number | null; lng: number | null };
  dropoff: { address: string; label: string; city?: string; lat: number | null; lng: number | null };
  merchant: { _id: string; name: string; logo?: string } | null;
}

// ─── Icon factory ─────────────────────────────────────────────────────────────

function makeDriverMarker(completed: boolean): L.DivIcon {
  const color = completed ? '#22c55e' : '#3b82f6';
  const ring  = completed ? '#dcfce7' : '#dbeafe';
  return L.divIcon({
    className: '',
    html: `<div style="width:38px;height:38px;border-radius:50%;background:${ring};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.28);">
      <div style="width:28px;height:28px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff;">🚚</div>
    </div>`,
    iconSize:    [38, 38],
    iconAnchor:  [19, 19],
    popupAnchor: [0, -22],
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const AgencyMapView: React.FC = () => {
  const { user }    = useAppSelector(s => s.auth);
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [mapError,   setMapError]   = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ── Fetch + geocode dropoff addresses ─────────────────────────────────────

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await api.get('/v1/agencies/me/deliveries/active-with-locations');
      const data: ActiveDelivery[] = res.data.data ?? [];
      setMapError(null);
      setDeliveries(data);

      // Fire geocoding for any dropoff that has an address but no coordinates
      data.forEach(async (d) => {
        if (d.dropoff.lat != null && d.dropoff.lng != null) return;
        if (!d.dropoff.address) return;
        const coords = await geocodeAddress(d.dropoff.address, d.dropoff.city);
        if (!coords) return;
        setDeliveries(prev => prev.map(p =>
          p._id === d._id
            ? { ...p, dropoff: { ...p.dropoff, lat: coords[0], lng: coords[1] } }
            : p,
        ));
      });
    } catch (e) {
      console.error('[AgencyMapView] fetch error', e);
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setMapError(msg || 'Impossible de charger la carte des livraisons. Réessayez dans quelques instants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 30_000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  // ── Socket: live driver positions + delivery completion ────────────────────

  useEffect(() => {
    if (!user?.agency) return;

    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('join_agency', String(user.agency));
    });

    s.on('driver:location:update', (data: { driverId: string; lat: number; lng: number; deliveryId?: string }) => {
      setDeliveries(prev =>
        prev.map(d => {
          // Match by deliveryId first (ArmadaOrders have no driver._id)
          if (data.deliveryId && d._id === data.deliveryId) {
            return { ...d, driver: d.driver ? { ...d.driver, lat: data.lat, lng: data.lng } : { name: '', lat: data.lat, lng: data.lng } };
          }
          // Fall back to matching by driver._id (manual Delivery records)
          if (!data.deliveryId && d.driver?._id === data.driverId) {
            return { ...d, driver: { ...d.driver!, lat: data.lat, lng: data.lng } };
          }
          return d;
        }),
      );
    });

    s.on('delivery_status_update', (data: { deliveryId: string; status: string }) => {
      if (data.status === 'delivered' || data.status === 'completed') {
        setDeliveries(prev =>
          prev.map(d => d._id === data.deliveryId ? { ...d, completed: true } : d),
        );
        setTimeout(() => {
          setDeliveries(prev => prev.filter(d => d._id !== data.deliveryId));
        }, 5_000);
      }
    });

    return () => { s.disconnect(); socketRef.current = null; };
  }, [user?.agency]);

  // ── Map bounds from all known positions ────────────────────────────────────

  const positions: [number, number][] = [];
  for (const d of deliveries) {
    if (d.driver?.lat  != null && d.driver?.lng  != null) positions.push([d.driver.lat,  d.driver.lng]);
    if (d.pickup.lat   != null && d.pickup.lng   != null) positions.push([d.pickup.lat,  d.pickup.lng]);
    if (d.dropoff.lat  != null && d.dropoff.lng  != null) positions.push([d.dropoff.lat, d.dropoff.lng]);
  }

  const bounds: [[number, number], [number, number]] | undefined =
    positions.length >= 2
      ? [
          [Math.min(...positions.map(p => p[0])), Math.min(...positions.map(p => p[1]))],
          [Math.max(...positions.map(p => p[0])), Math.max(...positions.map(p => p[1]))],
        ]
      : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500, color: '#94a3b8', fontSize: 15 }}>
        Chargement de la carte…
      </div>
    );
  }

  if (mapError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 420, gap: 12, color: '#64748b', textAlign: 'center', padding: '0 24px',
      }}>
        <span style={{ fontSize: 32 }}>🗺️</span>
        <p style={{ margin: 0, fontSize: 14, maxWidth: 360 }}>{mapError}</p>
        <button
          onClick={() => { setMapError(null); setLoading(true); fetchDeliveries(); }}
          style={{
            padding: '7px 18px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: '#fff', fontSize: 13, cursor: 'pointer', color: '#3b82f6',
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Legend + count */}
      <div style={{ display: 'flex', gap: 20, padding: '12px 0 16px', flexWrap: 'wrap', fontSize: 12, color: '#475569', alignItems: 'center' }}>
        {([
          { color: '#3b82f6', label: 'En livraison' },
          { color: '#22c55e', label: 'Livré'        },
        ] as const).map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 3, background: '#3b82f6', borderRadius: 2 }} />
          Route active
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 3, background: '#22c55e', borderRadius: 2 }} />
          Livré
        </div>
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontWeight: 600 }}>
          {deliveries.length} commande{deliveries.length !== 1 ? 's' : ''} active{deliveries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Map */}
      <ArmadaMap
        center={positions[0] ?? DEFAULT_CENTER}
        zoom={positions.length > 0 ? 12 : 10}
        height="560px"
        bounds={bounds}
        boundsPadding={60}
      >
        {deliveries.map(d => (
          <React.Fragment key={d._id}>

            {/* Pickup / merchant marker — shown for every order that has merchant GPS */}
            {d.pickup.lat != null && d.pickup.lng != null && (
              <Marker position={[d.pickup.lat, d.pickup.lng]} icon={makePickupPin()}>
                <Popup>
                  <strong style={{ display: 'block', marginBottom: 4 }}>🟢 Collecte</strong>
                  <span>{d.merchant?.name || d.pickup.label}</span>
                  {d.pickup.address && (
                    <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {d.pickup.address}
                    </span>
                  )}
                  <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {d.orderId || d._id} · {d.status}
                  </span>
                </Popup>
              </Marker>
            )}

            {/* Dropoff / client marker — appears as geocoding resolves */}
            {d.dropoff.lat != null && d.dropoff.lng != null && (
              <Marker position={[d.dropoff.lat, d.dropoff.lng]} icon={makeDeliveryPin()}>
                <Popup>
                  <strong style={{ display: 'block', marginBottom: 4 }}>🔴 Livraison</strong>
                  <span>{d.dropoff.label}</span>
                  {d.dropoff.address && (
                    <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {d.dropoff.address}
                    </span>
                  )}
                </Popup>
              </Marker>
            )}

            {/* Driver marker */}
            {d.driver?.lat != null && d.driver?.lng != null && (
              <Marker
                position={[d.driver.lat, d.driver.lng]}
                icon={makeDriverMarker(!!d.completed)}
              >
                <Popup>
                  <div style={{ minWidth: 210, fontFamily: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {d.driver.avatar
                        ? <img src={d.driver.avatar} alt={d.driver.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {(d.driver.name || '?').slice(0, 2).toUpperCase()}
                          </div>
                      }
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>🚚 {d.driver.name || 'Livreur'}</div>
                        {d.driver.phone && <div style={{ fontSize: 11, color: '#64748b' }}>{d.driver.phone}</div>}
                      </div>
                    </div>
                    {d.orderId && (
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>
                        ID: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{d.orderId}</code>
                      </div>
                    )}
                    {d.merchant && (
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>🏪 {d.merchant.name}</div>
                    )}
                    {d.dropoff.address && (
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>📍 {d.dropoff.address}</div>
                    )}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: d.completed ? '#dcfce7' : '#dbeafe',
                      color:      d.completed ? '#16a34a' : '#1d4ed8',
                    }}>
                      {d.completed ? '✅ Livré' : `⏳ ${d.clientStatus || d.status}`}
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route polyline: pickup → driver → dropoff (any 2+ known points) */}
            {(() => {
              const pts: [number, number][] = [];
              if (d.pickup.lat  != null && d.pickup.lng  != null) pts.push([d.pickup.lat,  d.pickup.lng]);
              if (d.driver?.lat != null && d.driver?.lng != null) pts.push([d.driver.lat,  d.driver.lng]);
              if (d.dropoff.lat != null && d.dropoff.lng != null) pts.push([d.dropoff.lat, d.dropoff.lng]);
              if (pts.length < 2) return null;
              return (
                <Polyline
                  positions={pts}
                  color={d.completed ? '#22c55e' : '#3b82f6'}
                  weight={3}
                  dashArray={d.completed ? undefined : '8 5'}
                  opacity={0.75}
                />
              );
            })()}

          </React.Fragment>
        ))}
      </ArmadaMap>

      {deliveries.length === 0 && (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 16, padding: '20px 0' }}>
          Aucune commande active en cours pour le moment.
        </p>
      )}
    </div>
  );
};

export default AgencyMapView;
