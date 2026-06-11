import 'leaflet/dist/leaflet.css';

import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';

// ── Google Maps style marker factories ────────────────────────────────────────
/** Green teardrop pin — pickup / origin */
export const makePickupPin = (): L.DivIcon => L.divIcon({
  className: '',
  html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"
         style="overflow:visible;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.38))">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174L12 36l4.373-12.826C20.837 21.426 24 17.084 24 12 24 5.373 18.627 0 12 0z"
          fill="#34a853" stroke="#2a7a40" stroke-width="0.6"/>
    <circle cx="12" cy="12" r="5.5" fill="white" opacity="0.93"/>
    <circle cx="12" cy="12" r="2.8" fill="#34a853"/>
  </svg>`,
  iconSize:    [24, 36],
  iconAnchor:  [12, 36],
  popupAnchor: [0, -38],
});

/** Red teardrop pin — delivery / destination */
export const makeDeliveryPin = (): L.DivIcon => L.divIcon({
  className: '',
  html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"
         style="overflow:visible;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.38))">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174L12 36l4.373-12.826C20.837 21.426 24 17.084 24 12 24 5.373 18.627 0 12 0z"
          fill="#ea4335" stroke="#bf2a1e" stroke-width="0.6"/>
    <circle cx="12" cy="12" r="5.5" fill="white" opacity="0.93"/>
    <circle cx="12" cy="12" r="2.8" fill="#ea4335"/>
  </svg>`,
  iconSize:    [24, 36],
  iconAnchor:  [12, 36],
  popupAnchor: [0, -38],
});

/** Blue circle with direction arrow — driver.
 *  heading: 0 = north, 90 = east, 180 = south, 270 = west */
export const makeDriverIcon = (heading = 0): L.DivIcon => L.divIcon({
  className: '',
  html: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#4285F4" fill-opacity="0.18"/>
    <circle cx="20" cy="20" r="11" fill="#4285F4" stroke="white" stroke-width="2.5"/>
    <polygon points="20,9 16.5,20.5 20,17.5 23.5,20.5"
             fill="white" transform="rotate(${heading},20,20)"/>
  </svg>`,
  iconSize:   [40, 40],
  iconAnchor: [20, 20],
});

// ── Props ──────────────────────────────────────────────────────────────────────
export interface LocalMapProps {
  center?:      [number, number];
  zoom?:        number;
  height?:      string;
  interactive?: boolean;
  style?:       React.CSSProperties;
  className?:   string;
  children?:    React.ReactNode;
}

// ── LocalMap ───────────────────────────────────────────────────────────────────
const LocalMap: React.FC<LocalMapProps> = ({
  center      = [29.2733, 48.0059],
  zoom        = 11,
  height      = '100%',
  interactive = true,
  style,
  className,
  children,
}) => {
  const wrapperStyle: React.CSSProperties = {
    height,
    width:         '100%',
    position:      'relative',
    borderRadius:  'inherit',
    overflow:      'hidden',
    pointerEvents: interactive ? undefined : 'none',
    ...style,
  };

  const interactionProps = interactive
    ? { zoomControl: true as const }
    : {
        dragging:           false as const,
        zoomControl:        false as const,
        scrollWheelZoom:    false as const,
        doubleClickZoom:    false as const,
        touchZoom:          false as const,
        keyboard:           false as const,
        attributionControl: false as const,
      };

  return (
    <div style={wrapperStyle} className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        {...interactionProps}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        />
        {children}
      </MapContainer>
    </div>
  );
};

export default LocalMap;
