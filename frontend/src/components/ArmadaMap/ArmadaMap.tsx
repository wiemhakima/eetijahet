import 'leaflet/dist/leaflet.css';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

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

/** Forwards map-click events to a parent handler. Must be rendered inside MapContainer. */
function MapEvents({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({ click: e => onClick(e) });
  return null;
}

export interface ArmadaMapProps {
  center?:          [number, number];
  zoom?:            number;
  height?:          string;
  style?:           React.CSSProperties;
  className?:       string;
  children?:        React.ReactNode;
  bounds?:          [[number, number], [number, number]];
  boundsPadding?:   number;
  showRoads?:       boolean;
  showBoundary?:    boolean;
  showAreaLabels?:  boolean;
  onClick?:         (e: L.LeafletMouseEvent) => void;
}

/** Fits the map view to the given bounds whenever they change. */
const BoundsFitter: React.FC<{ bounds: [[number, number], [number, number]]; padding: number }> = ({ bounds, padding }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [padding, padding] });
  }, [map, bounds, padding]);
  return null;
};

const ArmadaMap: React.FC<ArmadaMapProps> = ({
  center    = [29.2733, 48.0059],
  zoom      = 11,
  height    = '100%',
  style,
  className,
  children,
  bounds,
  boundsPadding = 40,
  showRoads: _showRoads,
  showBoundary: _showBoundary,
  showAreaLabels: _showAreaLabels,
  onClick,
}) => (
  <div style={{ height, width: '100%', position: 'relative', ...style }} className={className}>
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      />
      {bounds && <BoundsFitter bounds={bounds} padding={boundsPadding} />}
      {onClick && <MapEvents onClick={onClick} />}
      {children}
    </MapContainer>
  </div>
);

export default ArmadaMap;
