import ArmadaMap from '../ArmadaMap';
import { CircleMarker, Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import api from '../../api';
import { useAppSelector } from '../../store/hooks';

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props { mode: 'sandbox' | 'admin'; }

// ── Map pins ──────────────────────────────────────────────────────────────────
const pickupIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#22c55e"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`,
  iconSize: [32, 48], iconAnchor: [16, 48],
});
const dropoffIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#ef4444"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`,
  iconSize: [32, 48], iconAnchor: [16, 48],
});

// Route animation keyframes (injected once)
if (typeof document !== 'undefined' && !document.getElementById('rot-anim')) {
  const s = document.createElement('style');
  s.id = 'rot-anim';
  s.textContent = `
    @keyframes routeFlow { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
    .route-flow { stroke-dasharray: 8 16 !important; animation: routeFlow 0.75s linear infinite !important; }
    @keyframes roc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(s);
}

// ── Kuwait data ───────────────────────────────────────────────────────────────
const KUWAIT_CITIES = [
  { name: 'Kuwait City',    lat: 29.3759, lon: 47.9774 },
  { name: 'Salmiya',        lat: 29.3320, lon: 48.0759 },
  { name: 'Hawalli',        lat: 29.3341, lon: 48.0289 },
  { name: 'Farwaniya',      lat: 29.2733, lon: 47.9594 },
  { name: 'Fahaheel',       lat: 29.0761, lon: 48.1320 },
  { name: 'Jahra',          lat: 29.3375, lon: 47.6581 },
  { name: 'Ahmadi',         lat: 29.0769, lon: 48.0838 },
  { name: 'Mangaf',         lat: 29.0986, lon: 48.1314 },
  { name: 'Abu Halifa',     lat: 29.1341, lon: 48.1117 },
  { name: 'Sabah Al-Salem', lat: 29.2333, lon: 48.0833 },
  { name: 'Rumaithiya',     lat: 29.3167, lon: 48.0667 },
  { name: 'Salwa',          lat: 29.2833, lon: 48.0833 },
  { name: 'Mishref',        lat: 29.2667, lon: 48.0500 },
  { name: 'Bayan',          lat: 29.2833, lon: 48.0833 },
  { name: 'Shuwaikh',       lat: 29.3667, lon: 47.9333 },
  { name: 'Sulaibikhat',    lat: 29.4167, lon: 47.9167 },
  { name: 'Qadsiya',        lat: 29.3500, lon: 47.9667 },
  { name: 'Fintas',         lat: 29.1167, lon: 48.1167 },
  { name: 'Mahboula',       lat: 29.0667, lon: 48.1333 },
];
const KUWAIT_CENTER: [number, number] = [29.2733, 48.0059];

// ── Types ─────────────────────────────────────────────────────────────────────
interface LatLon     { lat: number; lon: number; }
interface RouteWaypoint { id: string; lat: number; lon: number; order: number; }
interface RouteResult {
  coordinates: [number, number][];
  waypoints?:  RouteWaypoint[];
  distance_km: number;
  eta_minutes: number;
  fallback?:   boolean;
}
interface GraphNode { id: string; lat: number; lon: number; visit_count: number; }
interface GraphEdge { from_id: string; to_id: string; from_lat: number; from_lon: number; to_lat: number; to_lon: number; avg_speed: number; weight: number; }
interface FlaskResponse {
  path?:      ([number, number] | { lat: number; lon?: number; lng?: number })[];
  waypoints?: RouteWaypoint[];
  distance?:  number;
  eta?:       number;
  fallback?:  boolean;
  error?:     string;
}
interface OsrmResponse { code: string; routes: Array<{ geometry: string; distance: number; duration: number }>; }
interface GraphStatus { running: boolean; message: string; last_build: string | null; nodes: number; edges: number; loaded: boolean; }
interface GraphInfo { source: string; version: string; geomEdges: number; isOsmnx: boolean; sample_edge_has_waypoints: boolean; action_needed: string | null; }

// ── localStorage persistence ──────────────────────────────────────────────────
const STORAGE_KEY = 'armada_route_state';
interface PersistedState { pickup: LatLon; dropoff: LatLon; pickupCity: string; dropoffCity: string; aiRoute: RouteResult; osrmRoute: RouteResult | null; }
function saveRouteState(s: PersistedState) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* quota */ } }
function loadRouteState(): PersistedState | null { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? (JSON.parse(raw) as PersistedState) : null; } catch { return null; } }

// ── Edge color by speed ───────────────────────────────────────────────────────
function edgeColor(avgSpeed: number): string {
  if (avgSpeed < 40) return '#ef4444';
  if (avgSpeed < 70) return '#f97316';
  return '#22c55e';
}

// ── Canvas graph layer ────────────────────────────────────────────────────────
const GraphLayer: React.FC<{ nodes: GraphNode[]; edges: GraphEdge[]; showNodes: boolean; showEdges: boolean }> = ({ nodes, edges, showNodes, showEdges }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const canvas = L.canvas({ padding: 0.5 });
    const edgeGroup = L.layerGroup();
    if (showEdges) {
      edges.forEach(e => {
        L.polyline([[e.from_lat, e.from_lon], [e.to_lat, e.to_lon]], { color: edgeColor(e.avg_speed), weight: 1, opacity: 0.4, renderer: canvas }).addTo(edgeGroup);
      });
    }
    const nodeGroup = L.layerGroup();
    if (showNodes) {
      nodes.forEach(n => {
        const r = Math.min(2 + Math.log1p(n.visit_count) * 0.8, 9);
        const alpha = Math.min(0.4 + n.visit_count * 0.06, 1).toFixed(2);
        L.circleMarker([n.lat, n.lon], { radius: r, color: 'transparent', fillColor: `rgba(30,64,175,${alpha})`, fillOpacity: 1, weight: 0, renderer: canvas } as L.CircleMarkerOptions).addTo(nodeGroup);
      });
    }
    edgeGroup.addTo(map);
    nodeGroup.addTo(map);
    return () => { map.removeLayer(edgeGroup); map.removeLayer(nodeGroup); };
  }, [map, nodes, edges, showNodes, showEdges]);
  return null;
};

// ── Auto-fit route bounds ─────────────────────────────────────────────────────
const RouteFitter: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length < 2) return;
    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 16 });
  }, [map, coords]);
  return null;
};

// ── Map click handler ─────────────────────────────────────────────────────────
const MapClickHandler: React.FC<{ mode: 'pickup' | 'dropoff' | null; onPick: (ll: LatLon) => void }> = ({ mode, onPick }) => {
  useMapEvents({ click(e) { if (mode) onPick({ lat: e.latlng.lat, lon: e.latlng.lng }); } });
  return null;
};

// ── Rebuild section (mode-aware, superadmin only) ─────────────────────────────
const RebuildSection: React.FC<{ mode: 'sandbox' | 'admin' }> = ({ mode }) => {
  const { t } = useTranslation();
  const [status,     setStatus]     = useState<GraphStatus | null>(null);
  const [info,       setInfo]       = useState<GraphInfo | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const hasLoaded = useRef(false);

  const SANDBOX_API = 'http://127.0.0.1:3000';

  const fetchStatus = async () => {
    const ctrl    = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);
    try {
      if (mode === 'admin') {
        const [sr] = await Promise.all([
          api.get<GraphStatus>('/v1/admin/routing/graph_status'),
        ]);
        setStatus(sr.data);
      } else {
        const [sRes, iRes] = await Promise.all([
          fetch(`${SANDBOX_API}/graph_status`, { signal: ctrl.signal }),
          fetch(`${SANDBOX_API}/graph_info`,   { signal: ctrl.signal }),
        ]);
        if (sRes.ok) setStatus(await sRes.json() as GraphStatus);
        if (iRes.ok) setInfo(await iRes.json() as GraphInfo);
      }
    } catch { /* silent */ } finally { clearTimeout(timeout); }
  };

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    fetchStatus();
  }, []);

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      if (mode === 'admin') {
        await api.post('/v1/admin/routing/rebuild_graph', { use_osmnx: true });
      } else {
        const res = await fetch(`${SANDBOX_API}/rebuild_graph`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ use_osmnx: true }),
        });
        if (!res.ok) { const d = await res.json() as { error?: string }; throw new Error(d.error ?? `HTTP ${res.status}`); }
      }
    } catch (e) { console.error('Rebuild error:', e); }
    finally { setRebuilding(false); fetchStatus(); }
  };

  const fmt = (iso: string | null) => { if (!iso) return '—'; try { return new Date(iso).toLocaleString(); } catch { return iso; } };
  const isRunning = status?.running || rebuilding;
  const sourceBadge = info ? (info.isOsmnx ? { label: 'OSMnx ✓', color: '#22c55e' } : { label: info.source === 'historical' ? 'Historique ⚠' : 'Inconnu ⚠', color: '#f97316' }) : null;

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={rebuildHeaderStyle}>{t('roadGraph.graphStatus')}</div>
        {sourceBadge && (
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: sourceBadge.color, border: `1px solid ${sourceBadge.color}`, borderRadius: '4px', padding: '1px 5px' }}>
            {sourceBadge.label}
          </span>
        )}
      </div>
      <div style={rowStyle}>
        <StatBox label="Nœuds"  value={status ? status.nodes.toLocaleString() : '…'} />
        <StatBox label="Arêtes" value={status ? status.edges.toLocaleString() : '…'} />
        {info && <StatBox label="Courbes" value={info.geomEdges > 0 ? info.geomEdges.toLocaleString() : '0'} />}
      </div>
      {info && !info.isOsmnx && (
        <div style={warnStyle}>⚠ Graphe historique chargé — la route ne suivra pas les rues OSM. Lancez un Rebuild.</div>
      )}
      {status?.message && status.message !== 'idle' && (
        <div style={msgStyle(status.message.startsWith('Erreur'))}>
          {isRunning && <span style={spinnerStyle} />}
          {status.message}
        </div>
      )}
      <div style={lastBuiltStyle}>Dernier build : <span style={{ fontWeight: 600 }}>{fmt(status?.last_build ?? null)}</span></div>
      <button onClick={handleRebuild} disabled={isRunning} style={rebuildBtnStyle(isRunning)}>
        {isRunning ? '⏳ Rebuild en cours…' : '🔄 Rebuild Graph (OSMnx)'}
      </button>
      {info?.action_needed && <div style={actionStyle}>{info.action_needed}</div>}
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={statBoxStyle}>
    <span style={{ fontSize: '0.65rem', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>{value}</span>
  </div>
);

// ── Location card (pickup / dropoff) ──────────────────────────────────────────
const LocationCard: React.FC<{
  type: 'pickup' | 'dropoff';
  label: string;
  cityValue: string;
  onCityChange: (name: string) => void;
  clickMode: 'pickup' | 'dropoff' | null;
  onToggleClick: () => void;
  clickLabel: string;
  pickLabel: string;
  coords: LatLon | null;
  selectCityLabel: string;
}> = ({ type, label, cityValue, onCityChange, clickMode, onToggleClick, clickLabel, pickLabel, coords, selectCityLabel }) => {
  const isPickup  = type === 'pickup';
  const accent    = isPickup ? '#16a34a' : '#dc2626';
  const accentBg  = isPickup ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)';
  const isActive  = clickMode === type;

  const coordText = coords ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
      padding: '0.6rem 0.7rem', borderRadius: '10px',
      background: accentBg,
      border: `1.5px solid ${accent}33`,
      borderLeft: `3px solid ${accent}`,
    }}>
      {/* Label with icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '18px', height: '18px', borderRadius: '50%',
          background: accent, color: '#fff', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
        }}>
          {isPickup ? 'A' : 'B'}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: accent }}>{label}</span>
      </div>

      {/* City select */}
      <select
        value={cityValue}
        onChange={e => onCityChange(e.target.value)}
        style={{ ...selectStyle, borderColor: `${accent}44` }}
      >
        <option value="">— {selectCityLabel} —</option>
        {KUWAIT_CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
      </select>

      {/* Pick on map button */}
      <button
        style={isActive ? { ...pickBtnStyle(accent), ...pickBtnActiveStyle(accent) } : pickBtnStyle(accent)}
        onClick={onToggleClick}
      >
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ flexShrink: 0 }}>
          <path d="M6 0C3.24 0 1 2.24 1 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fill="currentColor"/>
        </svg>
        {isActive ? clickLabel : pickLabel}
      </button>

      {/* Coordinates badge */}
      {coordText && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.18rem 0.45rem', borderRadius: '4px',
          background: `${accent}18`, border: `1px solid ${accent}33`,
          fontSize: '0.68rem', fontFamily: 'monospace', color: accent, width: 'fit-content',
        }}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="4" cy="4" r="1" fill="currentColor"/>
          </svg>
          {coordText}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const RouteOptimizerCore: React.FC<Props> = ({ mode }) => {
  const { t } = useTranslation();
  const user = useAppSelector(state => state.auth.user);
  const isSuperAdmin = user?.role === 'admin';

  const [pickup,        setPickup]        = useState<LatLon | null>(null);
  const [dropoff,       setDropoff]       = useState<LatLon | null>(null);
  const [pickupCity,    setPickupCity]    = useState('');
  const [dropoffCity,   setDropoffCity]   = useState('');
  const [clickMode,     setClickMode]     = useState<'pickup' | 'dropoff' | null>(null);
  const [aiRoute,       setAiRoute]       = useState<RouteResult | null>(null);
  const [osrmRoute,     setOsrmRoute]     = useState<RouteResult | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [apiKey,        setApiKey]        = useState('');
  const [graphNodes,    setGraphNodes]    = useState<GraphNode[]>([]);
  const [graphEdges,    setGraphEdges]    = useState<GraphEdge[]>([]);
  const [graphLoading,  setGraphLoading]  = useState(false);
  const [showGraphNodes, setShowGraphNodes] = useState(false);
  const [showGraphEdges, setShowGraphEdges] = useState(false);
  const [showAiRoute,    setShowAiRoute]    = useState(true);

  const apiBase = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const s = loadRouteState();
    if (!s) return;
    setPickup(s.pickup); setDropoff(s.dropoff);
    setPickupCity(s.pickupCity); setDropoffCity(s.dropoffCity);
    setAiRoute(s.aiRoute);
    if (s.osrmRoute) setOsrmRoute(s.osrmRoute);
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPickup(null); setDropoff(null); setPickupCity(''); setDropoffCity('');
    setAiRoute(null); setOsrmRoute(null); setError(null);
  }, []);

  const handleCitySelect = (which: 'pickup' | 'dropoff', name: string) => {
    const city = KUWAIT_CITIES.find(c => c.name === name);
    if (!city) return;
    const pt: LatLon = { lat: city.lat, lon: city.lon };
    if (which === 'pickup')  { setPickup(pt);  setPickupCity(name); }
    else                     { setDropoff(pt); setDropoffCity(name); }
  };

  const handleMapClick = (ll: LatLon) => {
    if (clickMode === 'pickup')  { setPickup(ll);  setPickupCity(''); }
    if (clickMode === 'dropoff') { setDropoff(ll); setDropoffCity(''); }
    setClickMode(null);
  };

  const decodePolyline = (enc: string): [number, number][] => {
    const out: [number, number][] = [];
    let i = 0, lat = 0, lng = 0;
    while (i < enc.length) {
      let b, s = 0, r = 0;
      do { b = enc.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
      lat += r & 1 ? ~(r >> 1) : r >> 1;
      s = 0; r = 0;
      do { b = enc.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
      lng += r & 1 ? ~(r >> 1) : r >> 1;
      out.push([lat / 1e5, lng / 1e5]);
    }
    return out;
  };

  const fetchOsrm = async (p: LatLon, d: LatLon): Promise<RouteResult> => {
    const url  = `https://router.project-osrm.org/route/v1/driving/${p.lon},${p.lat};${d.lon},${d.lat}?overview=full&geometries=polyline`;
    const data = await (await fetch(url)).json() as OsrmResponse;
    if (data.code !== 'Ok') throw new Error('OSRM no route');
    const r = data.routes[0];
    return { coordinates: decodePolyline(r.geometry), distance_km: Math.round((r.distance / 1000) * 10) / 10, eta_minutes: Math.round(r.duration / 60) };
  };

  const handleOptimize = async () => {
    if (!pickup || !dropoff) { setError('Select both pickup and drop-off points.'); return; }
    if (mode === 'sandbox' && !apiKey) { setError('Please enter your API key.'); return; }
    setLoading(true); setError(null); setAiRoute(null); setOsrmRoute(null);
    try {
      let aiData: FlaskResponse;
      const [aiRes, osrm] = await Promise.all([
        mode === 'admin'
          ? api.post<FlaskResponse>('/v1/admin/routing/predict_route', { start: [pickup.lat, pickup.lon], end: [dropoff.lat, dropoff.lon] }).then(r => r.data)
          : fetch(`${apiBase}/v1/routing/predict_route`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
              body: JSON.stringify({ start: [pickup.lat, pickup.lon], end: [dropoff.lat, dropoff.lon] }),
            }).then(r => r.json() as Promise<FlaskResponse>),
        fetchOsrm(pickup, dropoff),
      ]);
      aiData = aiRes as FlaskResponse;
      if (aiData.error) throw new Error(aiData.error);
      const streetCoords: [number, number][] = (aiData.path ?? []).map(p =>
        Array.isArray(p) ? [p[0], p[1]] : [p.lat, (p as { lon?: number; lng?: number }).lon ?? (p as { lon?: number; lng?: number }).lng ?? 0]
      );
      const computedAiRoute: RouteResult = {
        coordinates: streetCoords,
        waypoints:   aiData.waypoints ?? [],
        distance_km: Math.round(((aiData.distance ?? 0) / 1000) * 10) / 10,
        eta_minutes: Math.round(aiData.eta ?? 0),
        fallback:    aiData.fallback,
      };
      setAiRoute(computedAiRoute);
      setOsrmRoute(osrm);
      saveRouteState({ pickup: pickup!, dropoff: dropoff!, pickupCity, dropoffCity, aiRoute: computedAiRoute, osrmRoute: osrm });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check that python app.py is running');
    } finally { setLoading(false); }
  };

  const handleLoadGraph = async () => {
    if (mode === 'sandbox' && !apiKey) { setError('Please enter your API key.'); return; }
    setGraphLoading(true); setError(null);
    try {
      let nodesData: { nodes?: GraphNode[]; error?: string };
      let edgesData: { edges?: GraphEdge[]; error?: string };
      if (mode === 'admin') {
        const [nr, er] = await Promise.all([
          api.get<{ nodes: GraphNode[] }>('/v1/admin/routing/graph/nodes'),
          api.get<{ edges: GraphEdge[] }>('/v1/admin/routing/graph/edges'),
        ]);
        nodesData = nr.data;
        edgesData = er.data;
      } else {
        const [nr, er] = await Promise.all([
          fetch(`${apiBase}/v1/routing/graph/nodes`, { headers: { 'X-API-Key': apiKey } }),
          fetch(`${apiBase}/v1/routing/graph/edges`, { headers: { 'X-API-Key': apiKey } }),
        ]);
        nodesData = await nr.json() as { nodes?: GraphNode[]; error?: string };
        edgesData = await er.json() as { edges?: GraphEdge[]; error?: string };
      }
      if (nodesData.error) throw new Error(nodesData.error);
      if (edgesData.error) throw new Error(edgesData.error);
      setGraphNodes(nodesData.nodes ?? []);
      setGraphEdges(edgesData.edges ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load graph data');
    } finally { setGraphLoading(false); }
  };

  const mapBounds: [[number, number], [number, number]] | undefined = pickup && dropoff
    ? [[Math.min(pickup.lat, dropoff.lat), Math.min(pickup.lon, dropoff.lon)], [Math.max(pickup.lat, dropoff.lat), Math.max(pickup.lon, dropoff.lon)]]
    : undefined;
  const graphLoaded = graphNodes.length > 0 || graphEdges.length > 0;

  return (
    <div style={{ display: 'flex', gap: '1rem', minHeight: '520px' }}>

      {/* ── Left panel ── */}
      <div style={{ width: '290px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{t('roadGraph.title')}</h3>
        <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.5 }}>{t('roadGraph.subtitle')}</p>

        {/* API Key — sandbox only */}
        {mode === 'sandbox' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>{t('roadGraph.apiKeyLabel')}</label>
            <input
              type="password"
              placeholder={t('roadGraph.apiKeyPlaceholder')}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              style={{ ...selectStyle, fontFamily: 'monospace' }}
            />
          </div>
        )}

        {/* Pickup card */}
        <LocationCard
          type="pickup"
          label={t('roadGraph.pickup')}
          cityValue={pickupCity}
          onCityChange={name => handleCitySelect('pickup', name)}
          clickMode={clickMode}
          onToggleClick={() => setClickMode(clickMode === 'pickup' ? null : 'pickup')}
          clickLabel={t('roadGraph.clickOnMap')}
          pickLabel={t('roadGraph.pickOnMap')}
          coords={pickup}
          selectCityLabel={t('roadGraph.selectCity')}
        />

        {/* Drop-off card */}
        <LocationCard
          type="dropoff"
          label={t('roadGraph.dropoff')}
          cityValue={dropoffCity}
          onCityChange={name => handleCitySelect('dropoff', name)}
          clickMode={clickMode}
          onToggleClick={() => setClickMode(clickMode === 'dropoff' ? null : 'dropoff')}
          clickLabel={t('roadGraph.clickOnMap')}
          pickLabel={t('roadGraph.pickOnMap')}
          coords={dropoff}
          selectCityLabel={t('roadGraph.selectCity')}
        />

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={handleOptimize} disabled={loading || !pickup || !dropoff} style={{ ...optimizeBtnStyle(loading || !pickup || !dropoff), flex: 1 }}>
            {loading ? t('roadGraph.optimizing') : t('roadGraph.optimizeBtn')}
          </button>
          <button onClick={handleReset} title="Clear route and reset map" style={{ padding: '0.55rem 0.65rem', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.18)', color: '#f87171', fontSize: '0.88rem', cursor: 'pointer', flexShrink: 0 }}>
            ✕
          </button>
        </div>

        {/* Graph controls */}
        <div style={graphPanelStyle}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>{t('roadGraph.graphTitle')}</div>
          <button onClick={handleLoadGraph} disabled={graphLoading} style={optimizeBtnStyle(graphLoading)}>
            {graphLoading ? t('roadGraph.loadingGraph') : graphLoaded ? t('roadGraph.reloadGraph') : t('roadGraph.loadGraph')}
          </button>
          {graphLoaded && (
            <div style={{ fontSize: '0.72rem', opacity: 0.55, fontFamily: 'monospace' }}>
              {graphNodes.length.toLocaleString()} {t('roadGraph.nodesLabel')} · {graphEdges.length.toLocaleString()} {t('roadGraph.edgesCount')}
            </div>
          )}

          {/* Superadmin-only checkboxes */}
          {isSuperAdmin && (
            <label style={toggleStyle}>
              <input type="checkbox" checked={showGraphNodes} onChange={e => setShowGraphNodes(e.target.checked)} />
              <span style={toggleDot('#3b82f6')} />
              {t('roadGraph.showNodes')}
            </label>
          )}
          {isSuperAdmin && (
            <label style={toggleStyle}>
              <input type="checkbox" checked={showGraphEdges} onChange={e => setShowGraphEdges(e.target.checked)} />
              <span style={toggleDot('#6b7280')} />
              {t('roadGraph.showEdges')}
            </label>
          )}

          {/* Visible to all roles */}
          <label style={toggleStyle}>
            <input type="checkbox" checked={showAiRoute} onChange={e => setShowAiRoute(e.target.checked)} />
            <span style={toggleDot('#4285F4')} />
            {t('roadGraph.showAiRoute')}
          </label>

          {isSuperAdmin && (
            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>
              {t('roadGraph.edgesLabel')} <span style={{ color: '#ef4444' }}>■</span> {t('roadGraph.slow')} &nbsp;
              <span style={{ color: '#f97316' }}>■</span> {t('roadGraph.mid')} &nbsp;
              <span style={{ color: '#22c55e' }}>■</span> {t('roadGraph.fast')}
            </div>
          )}
        </div>

        {/* Rebuild section — superadmin only */}
        {isSuperAdmin && <RebuildSection mode={mode} />}

        {error && <div style={errorStyle}>{error}</div>}

        {/* Results — superadmin sees full details, developer sees nothing */}
        {aiRoute && isSuperAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={legendRow}>
              <svg width="28" height="6" style={{ flexShrink: 0 }}>
                <line x1="0" y1="3" x2="28" y2="3" stroke={aiRoute.fallback ? '#f97316' : '#4285F4'} strokeWidth="4" strokeLinecap="round"/>
              </svg>
              Armada A* Route {aiRoute.fallback ? '⚠ estimated' : '✓'}
            </div>
            <div style={resultCardStyle}>
              <ResultRow label="Distance"  value={`${aiRoute.distance_km} km`} />
              <ResultRow label="ETA"       value={`${aiRoute.eta_minutes} min`} />
              <ResultRow label="Noeuds A*" value={`${(aiRoute.waypoints ?? []).length}`} />
            </div>
            {osrmRoute && (
              <>
                <div style={{ ...legendRow, opacity: 0.55, fontSize: '0.75rem' }}>
                  vs OSRM reference: {osrmRoute.distance_km} km · {osrmRoute.eta_minutes} min
                </div>
                <div style={diffCardStyle}>
                  <ResultRow label="Δ Distance" value={`${Math.abs(aiRoute.distance_km - osrmRoute.distance_km).toFixed(1)} km`} />
                  <ResultRow label="Δ ETA"      value={`${Math.abs(aiRoute.eta_minutes - osrmRoute.eta_minutes)} min`} />
                </div>
              </>
            )}
          </div>
        )}

        {/* Route success indicator for developer (minimal feedback) */}
        {aiRoute && !isSuperAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.6rem', borderRadius: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <svg width="28" height="6" style={{ flexShrink: 0 }}>
              <line x1="0" y1="3" x2="28" y2="3" stroke={aiRoute.fallback ? '#f97316' : '#4285F4'} strokeWidth="4" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
              Route optimisée {aiRoute.fallback ? '⚠' : '✓'}
            </span>
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, borderRadius: '10px', overflow: 'hidden', minHeight: '480px', boxShadow: '0 2px 16px rgba(0,0,0,0.18)', cursor: clickMode ? 'crosshair' : 'grab' }}>
        <ArmadaMap center={KUWAIT_CENTER} zoom={10} bounds={mapBounds} boundsPadding={60} showRoads={true} showBoundary={true} showAreaLabels={true} height="100%" className={clickMode ? 'armada-map-crosshair' : undefined}>
          <MapClickHandler mode={clickMode} onPick={handleMapClick} />
          <GraphLayer nodes={graphNodes} edges={graphEdges} showNodes={showGraphNodes} showEdges={showGraphEdges} />
          {showAiRoute && aiRoute && aiRoute.coordinates.length > 1 && (
            <>
              <RouteFitter coords={aiRoute.coordinates} />
              <Polyline positions={aiRoute.coordinates} pathOptions={{ color: '#ffffff', weight: 10, opacity: 0.35, lineCap: 'round', lineJoin: 'round' }} />
              <Polyline positions={aiRoute.coordinates} pathOptions={{ color: aiRoute.fallback ? '#f97316' : '#2563EB', weight: 6, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
              {/* Yellow A* intermediate nodes — superadmin only */}
              {isSuperAdmin && (aiRoute.waypoints ?? []).slice(1, -1).map(wp => (
                <CircleMarker key={wp.id} center={[wp.lat, wp.lon]} radius={5} pathOptions={{ color: '#92400e', weight: 1.5, fillColor: '#fbbf24', fillOpacity: 0.9 }}>
                  <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>Noeud #{wp.id} — Étape {wp.order + 1}/{(aiRoute.waypoints ?? []).length}</span>
                  </Tooltip>
                </CircleMarker>
              ))}
              {(aiRoute.waypoints ?? []).length > 0 && <Marker position={[aiRoute.waypoints![0].lat, aiRoute.waypoints![0].lon]} icon={pickupIcon} zIndexOffset={1000} />}
              {(aiRoute.waypoints ?? []).length > 1 && <Marker position={[aiRoute.waypoints![aiRoute.waypoints!.length - 1].lat, aiRoute.waypoints![aiRoute.waypoints!.length - 1].lon]} icon={dropoffIcon} zIndexOffset={1000} />}
            </>
          )}
          {!aiRoute && pickup  && <Marker position={[pickup.lat,  pickup.lon]}  icon={pickupIcon}  zIndexOffset={500} />}
          {!aiRoute && dropoff && <Marker position={[dropoff.lat, dropoff.lon]} icon={dropoffIcon} zIndexOffset={500} />}
        </ArmadaMap>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const selectStyle: React.CSSProperties = { padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '0.82rem', width: '100%' };
const pickBtnStyle = (accent: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '0.35rem',
  padding: '0.38rem 0.7rem', borderRadius: '6px',
  border: `1px solid ${accent}55`,
  background: `${accent}12`, color: accent,
  fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
  transition: 'background 0.15s',
});
const pickBtnActiveStyle = (accent: string): React.CSSProperties => ({
  background: `${accent}28`, borderColor: accent, boxShadow: `0 0 0 2px ${accent}33`,
});
const optimizeBtnStyle = (disabled: boolean): React.CSSProperties => ({ padding: '0.55rem', borderRadius: '8px', border: 'none', background: disabled ? 'rgba(59,130,246,0.3)' : '#3b82f6', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: disabled ? 'not-allowed' : 'pointer' });
const errorStyle: React.CSSProperties = { padding: '0.5rem', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.78rem' };
const resultCardStyle: React.CSSProperties = { padding: '0.5rem 0.6rem', borderRadius: '6px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', flexDirection: 'column', gap: '0.25rem' };
const diffCardStyle: React.CSSProperties = { ...resultCardStyle, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' };
const legendRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 500 };
const graphPanelStyle: React.CSSProperties = { padding: '0.6rem 0.7rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '0.4rem' };
const toggleStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' };
const toggleDot = (color: string): React.CSSProperties => ({ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' });
// Rebuild section styles
const containerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' };
const rebuildHeaderStyle: React.CSSProperties = { fontSize: '0.78rem', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' };
const rowStyle: React.CSSProperties = { display: 'flex', gap: '0.4rem' };
const statBoxStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem', padding: '0.35rem 0.45rem', borderRadius: '6px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' };
const lastBuiltStyle: React.CSSProperties = { fontSize: '0.71rem', opacity: 0.5 };
const rebuildBtnStyle = (disabled: boolean): React.CSSProperties => ({ padding: '0.45rem', borderRadius: '7px', border: 'none', background: disabled ? 'rgba(168,85,247,0.3)' : '#a855f7', color: '#fff', fontWeight: 600, fontSize: '0.84rem', cursor: disabled ? 'not-allowed' : 'pointer' });
const msgStyle = (isError: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem', borderRadius: '6px', fontSize: '0.73rem', background: isError ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.1)', border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.25)'}`, color: isError ? '#f87171' : 'inherit', wordBreak: 'break-word' });
const warnStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', borderRadius: '6px', fontSize: '0.73rem', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' };
const actionStyle: React.CSSProperties = { fontSize: '0.72rem', opacity: 0.6, fontStyle: 'italic' };
const spinnerStyle: React.CSSProperties = { display: 'inline-block', width: '10px', height: '10px', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'roc-spin 0.7s linear infinite' };

const ResultRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
    <span style={{ opacity: 0.6 }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);

export default RouteOptimizerCore;
