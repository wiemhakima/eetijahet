import React, { useEffect, useRef, useState } from 'react';
import { Marker } from 'react-leaflet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import ArmadaMap, { makeDeliveryPin, makeDriverIcon, makePickupPin } from '../../components/ArmadaMap';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchClientDelivery } from '../../store/slices/deliverySlice';
import type { AgencyInfo, DriverInfo } from '../../store/slices/deliverySlice';
import './ClientDeliveryDetails.scss';

// ─── Re-use components from TrackPage ────────────────────────────────────────
import StatusTimeline from '../TrackPage/components/StatusTimeline';
import DriverCard     from '../TrackPage/components/DriverCard';

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><polyline points="12,19 5,12 12,5"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const pickupIcon  = makePickupPin();
const dropoffIcon = makeDeliveryPin();

const PKG_LABELS: Record<string, string> = {
  document: 'Document', small: 'Small', medium: 'Medium',
  large: 'Large', fragile: 'Fragile', food: 'Food',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ─── Component ────────────────────────────────────────────────────────────────

const ClientDeliveryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const { selectedDelivery: delivery, isLoading, error } = useAppSelector(s => s.delivery);

  const [driverPos,  setDriverPos]  = useState<{ lat: number; lng: number } | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);

  // Fetch delivery on mount
  useEffect(() => {
    if (id) dispatch(fetchClientDelivery(id));
    return () => { socketRef.current?.disconnect(); };
  }, [id, dispatch]);

  // Initialise Socket.IO after delivery loads
  useEffect(() => {
    if (!delivery?.trackingCode) return;
    if (delivery.lastLat) setDriverPos({ lat: delivery.lastLat, lng: delivery.lastLng! });

    const skt = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = skt;

    skt.on('connect', () => skt.emit('join_tracking', delivery.trackingCode));
    skt.on('location_update', (d: { lat: number; lng: number }) => setDriverPos(d));
    skt.on('status_update',  (d: { status: string })            => setLiveStatus(d.status));

    return () => skt.disconnect();
  }, [delivery?.trackingCode]);

  // ── Error / loading states ─────────────────────────────────────────────────
  if (isLoading && !delivery) {
    return (
      <div className="cdd-placeholder">
        <div className="cdd-spinner" />
        <p>Loading delivery…</p>
      </div>
    );
  }

  if (error || (!isLoading && !delivery)) {
    return (
      <div className="cdd-placeholder cdd-placeholder--error">
        <p>{error || 'Delivery not found.'}</p>
        <button className="cdd-back-btn" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!delivery) return null;

  const status    = liveStatus || delivery.clientStatus;
  const isLive    = ['accepted', 'picked_up', 'in_transit'].includes(status);
  const agencyObj = typeof delivery.agency === 'object' && delivery.agency ? delivery.agency as AgencyInfo : null;
  const driverObj = typeof delivery.driver === 'object' && delivery.driver ? delivery.driver as DriverInfo : null;

  const hasCoords  = delivery.pickupLat && delivery.dropoffLat;
  const bounds: [[number, number], [number, number]] | undefined = hasCoords
    ? [[
        Math.min(delivery.pickupLat!, delivery.dropoffLat!) - 0.02,
        Math.min(delivery.pickupLng!, delivery.dropoffLng!) - 0.02,
      ], [
        Math.max(delivery.pickupLat!, delivery.dropoffLat!) + 0.02,
        Math.max(delivery.pickupLng!, delivery.dropoffLng!) + 0.02,
      ]]
    : undefined;

  return (
    <div className="cdd">
      {/* Back + Header */}
      <div className="cdd__topbar">
        <button className="cdd__back" onClick={() => navigate(-1)}>
          <BackIcon /> Back
        </button>
        <div className="cdd__topbar-right">
          <span className="cdd__order-id">{delivery.orderId || delivery._id.slice(-8)}</span>
          {isLive && <span className="cdd__live-badge">● Live</span>}
          {delivery.trackingCode && (
            <Link
              to={`/track?code=${delivery.trackingCode}`}
              target="_blank"
              className="cdd__public-link"
              title="Open public tracking page"
            >
              <ExternalLinkIcon /> Public Track
            </Link>
          )}
        </div>
      </div>

      <div className="cdd__body">
        {/* Left panel */}
        <aside className="cdd__side">

          {/* Agency */}
          {agencyObj && (
            <div className="cdd__agency">
              {agencyObj.logo && <img src={agencyObj.logo} alt={agencyObj.name} className="cdd__agency-logo" />}
              <div>
                <p className="cdd__agency-name">{agencyObj.name}</p>
                {agencyObj.nameAr && <p className="cdd__agency-name-ar">{agencyObj.nameAr}</p>}
              </div>
            </div>
          )}

          {/* Status timeline */}
          <div className="cdd__section">
            <h3 className="cdd__section-title">Delivery Status</h3>
            <StatusTimeline status={status} />
          </div>

          {/* Addresses */}
          <div className="cdd__section">
            <h3 className="cdd__section-title">Addresses</h3>
            <div className="cdd__addresses">
              <div className="cdd__addr">
                <span className="cdd__addr-dot cdd__addr-dot--green" />
                <div>
                  <p className="cdd__addr-label">Pickup</p>
                  <p className="cdd__addr-value">
                    {delivery.pickupLabel || delivery.pickupAddress || (
                      delivery.pickupLat ? `${delivery.pickupLat.toFixed(4)}, ${delivery.pickupLng?.toFixed(4)}` : '—'
                    )}
                  </p>
                </div>
              </div>
              <div className="cdd__addr-connector" />
              <div className="cdd__addr">
                <span className="cdd__addr-dot cdd__addr-dot--red" />
                <div>
                  <p className="cdd__addr-label">Destination</p>
                  <p className="cdd__addr-value">
                    {delivery.dropoffLabel || delivery.dropoffAddress || (
                      delivery.dropoffLat ? `${delivery.dropoffLat.toFixed(4)}, ${delivery.dropoffLng?.toFixed(4)}` : '—'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Package info */}
          <div className="cdd__section">
            <h3 className="cdd__section-title">Package</h3>
            <div className="cdd__meta-grid">
              <div className="cdd__meta-item">
                <span className="cdd__meta-label">Type</span>
                <span className="cdd__meta-value">{PKG_LABELS[delivery.packageType] || delivery.packageType}</span>
              </div>
              {delivery.estimatedPrice !== undefined && (
                <div className="cdd__meta-item">
                  <span className="cdd__meta-label">Price</span>
                  <span className="cdd__meta-value">{delivery.estimatedPrice.toFixed(3)} KWD</span>
                </div>
              )}
              {delivery.eta_minutes && status !== 'delivered' && (
                <div className="cdd__meta-item">
                  <span className="cdd__meta-label"><ClockIcon /> ETA</span>
                  <span className="cdd__meta-value">{Math.round(delivery.eta_minutes)} min</span>
                </div>
              )}
              {delivery.distance_km && (
                <div className="cdd__meta-item">
                  <span className="cdd__meta-label"><MapPinIcon /> Distance</span>
                  <span className="cdd__meta-value">{delivery.distance_km} km</span>
                </div>
              )}
              <div className="cdd__meta-item">
                <span className="cdd__meta-label">Created</span>
                <span className="cdd__meta-value">{fmt(delivery.createdAt)}</span>
              </div>
            </div>
            {delivery.notes && (
              <p className="cdd__notes">{delivery.notes}</p>
            )}
          </div>

          {/* Driver */}
          {driverObj && (
            <div className="cdd__section">
              <h3 className="cdd__section-title">Your Driver</h3>
              <DriverCard
                driver={{
                  name:  `${driverObj.firstName} ${driverObj.lastName}`,
                  phone: driverObj.phone,
                }}
              />
            </div>
          )}
        </aside>

        {/* Map */}
        <div className="cdd__map">
          {hasCoords ? (
            <ArmadaMap height="100%" bounds={bounds} boundsPadding={60}>
              {delivery.pickupLat  && <Marker position={[delivery.pickupLat,  delivery.pickupLng!]}  icon={pickupIcon} />}
              {delivery.dropoffLat && <Marker position={[delivery.dropoffLat, delivery.dropoffLng!]} icon={dropoffIcon} />}
              {driverPos           && <Marker position={[driverPos.lat, driverPos.lng]}              icon={makeDriverIcon()} />}
            </ArmadaMap>
          ) : (
            <div className="cdd__map-empty">
              <MapPinIcon />
              <p>No coordinates available for this delivery</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDeliveryDetails;
