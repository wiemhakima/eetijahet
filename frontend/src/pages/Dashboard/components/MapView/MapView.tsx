import {
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import React, { useEffect, useState } from "react";

import L from "leaflet";
import ArmadaMap, { makePickupPin, makeDeliveryPin, makeDriverIcon } from "../../../../components/ArmadaMap";
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

// ── Icons — Google Maps style teardrop pins (no CDN) ──────────────────────────
const pickupIcon  = makePickupPin();
const dropoffIcon = makeDeliveryPin();
const driverIcon  = makeDriverIcon();

// ── Props ─────────────────────────────────────────────────────────────────────
interface MapViewProps {
  initialPickup?:  [number, number];
  initialDropoff?: [number, number];
  driverPosition?: [number, number] | null;
}

// ── Kuwait cities ─────────────────────────────────────────────────────────────
const KUWAIT_CITIES: { name: string; center: [number, number] }[] = [
  { name: "Kuwait City",    center: [29.3759, 47.9774] },
  { name: "Salmiya",        center: [29.3368, 48.0762] },
  { name: "Hawalli",        center: [29.3330, 48.0296] },
  { name: "Farwaniya",      center: [29.2775, 47.9592] },
  { name: "Ahmadi",         center: [29.0769, 48.0838] },
  { name: "Jahra",          center: [29.3378, 47.6572] },
  { name: "Shuwaikh",       center: [29.3600, 47.9300] },
  { name: "Rumaithiya",     center: [29.3263, 48.0833] },
  { name: "Salwa",          center: [29.3100, 48.0700] },
  { name: "Mishref",        center: [29.2917, 48.0583] },
  { name: "Abu Halifa",     center: [29.1500, 48.1200] },
  { name: "Fahaheel",       center: [29.0800, 48.1300] },
  { name: "Mangaf",         center: [29.1100, 48.1200] },
  { name: "Fintas",         center: [29.1300, 48.1300] },
  { name: "Mahboula",       center: [29.0600, 48.1400] },
  { name: "Sabah Al Salem", center: [29.2700, 48.0700] },
  { name: "Bayan",          center: [29.3050, 48.0850] },
  { name: "Riqqa",          center: [29.1700, 48.1300] },
  { name: "Subhan",         center: [29.2200, 48.1100] },
  { name: "Qurain",         center: [29.2500, 48.0600] },
  { name: "Ardiya",         center: [29.3000, 47.9500] },
  { name: "Sulaibiya",      center: [29.3600, 47.7500] },
  { name: "Khaitan",        center: [29.3000, 47.9700] },
  { name: "Sabahiya",       center: [29.0400, 48.1300] },
];

// ── Helpers inside MapContainer ───────────────────────────────────────────────
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 12); }, [center, map]);
  return null;
}

function ClickHandler({
  mode, setPickup, setDropoff,
}: {
  mode:       "pickup" | "dropoff" | null;
  setPickup:  (pos: [number, number]) => void;
  setDropoff: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      const pos: [number, number] = [e.latlng.lat, e.latlng.lng];
      if (mode === "pickup")  setPickup(pos);
      if (mode === "dropoff") setDropoff(pos);
    },
  });
  return null;
}

// ── OSRM polyline decoder ─────────────────────────────────────────────────────
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

async function fetchOSRM(pickup: [number, number], dropoff: [number, number]) {
  const url  = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${dropoff[1]},${dropoff[0]}?overview=full&geometries=polyline`;
  const res  = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok") throw new Error("OSRM: no route");
  const route = data.routes[0];
  return {
    path:     decodePolyline(route.geometry),
    distance: route.distance,
    eta:      route.duration / 60,
  };
}

// ── MapView ───────────────────────────────────────────────────────────────────
export default function MapView({
  initialPickup,
  initialDropoff,
  driverPosition,
}: MapViewProps = {}) {
  const token = useSelector((state: RootState) => state.auth.token) || localStorage.getItem('token') || '';

  const [pickup,    setPickup]    = useState<[number, number]>(initialPickup  ?? [29.3100, 48.0700]);
  const [dropoff,   setDropoff]   = useState<[number, number]>(initialDropoff ?? [29.1500, 48.1200]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialPickup  ?? [29.3100, 48.0700]);

  const [aiRoute,    setAiRoute]    = useState<[number, number][]>([]);
  const [aiDistance, setAiDistance] = useState(0);
  const [aiEta,      setAiEta]      = useState(0);
  const [aiFallback, setAiFallback] = useState(false);
  const [aiError,    setAiError]    = useState<string | null>(null);

  const [osrmRoute,    setOsrmRoute]    = useState<[number, number][]>([]);
  const [osrmDistance, setOsrmDistance] = useState(0);
  const [osrmEta,      setOsrmEta]      = useState(0);
  const [osrmError,    setOsrmError]    = useState<string | null>(null);

  const [showOsrm, setShowOsrm] = useState(true);
  const [showAi,   setShowAi]   = useState(true);
  const [loading,  setLoading]  = useState(false);

  const [apiKey,      setApiKey]      = useState<string>('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const [clickMode,       setClickMode]       = useState<"pickup" | "dropoff" | null>(null);
  const [pickupCityOpen,  setPickupCityOpen]  = useState(false);
  const [dropoffCityOpen, setDropoffCityOpen] = useState(false);
  const [pickupCityName,  setPickupCityName]  = useState("Salwa");
  const [dropoffCityName, setDropoffCityName] = useState("Abu Halifa");
  const [pickupSearch,    setPickupSearch]    = useState("");
  const [dropoffSearch,   setDropoffSearch]   = useState("");

  const [pickupLatInput,  setPickupLatInput]  = useState("29.31000");
  const [pickupLonInput,  setPickupLonInput]  = useState("48.07000");
  const [dropoffLatInput, setDropoffLatInput] = useState("29.15000");
  const [dropoffLonInput, setDropoffLonInput] = useState("48.12000");

  useEffect(() => { setPickupLatInput(pickup[0].toFixed(5));  setPickupLonInput(pickup[1].toFixed(5));  }, [pickup]);
  useEffect(() => { setDropoffLatInput(dropoff[0].toFixed(5)); setDropoffLonInput(dropoff[1].toFixed(5)); }, [dropoff]);

  const fetchBothRoutes = async (p: [number, number], d: [number, number]) => {
    if (!apiKey) {
      setAiError('Please enter your API key');
      return;
    }
    setLoading(true);

    // AI route
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res  = await fetch(`${apiBase}/v1/routing/predict_route`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ start: p, end: d }),
      });
      const data = await res.json();
      if (data.error) { setAiError(data.error); setAiRoute([]); }
      else {
        setAiRoute(data.path ?? []);
        setAiDistance(data.distance ?? 0);
        setAiEta(data.eta ?? 0);
        setAiFallback(data.fallback ?? false);
        setAiError(null);
      }
    } catch { setAiError("Serveur AI non disponible"); setAiRoute([]); }

    // OSRM reference
    try {
      const osrm = await fetchOSRM(p, d);
      setOsrmRoute(osrm.path);
      setOsrmDistance(osrm.distance);
      setOsrmEta(osrm.eta);
      setOsrmError(null);
    } catch { setOsrmError("OSRM non disponible"); setOsrmRoute([]); }

    setLoading(false);
  };

  useEffect(() => {
    if (!apiKey) return;
    fetchBothRoutes(pickup, dropoff);
  }, [pickup, dropoff, apiKey]);

  const handlePickupCity = (city: typeof KUWAIT_CITIES[0]) => {
    setPickupCityName(city.name);
    setPickupCityOpen(false);
    setPickupSearch("");
    setPickup(city.center);
    setMapCenter(city.center);
  };

  const handleDropoffCity = (city: typeof KUWAIT_CITIES[0]) => {
    setDropoffCityName(city.name);
    setDropoffCityOpen(false);
    setDropoffSearch("");
    setDropoff(city.center);
  };

  const applyCoords = () => {
    const pLat = parseFloat(pickupLatInput),  pLon = parseFloat(pickupLonInput);
    const dLat = parseFloat(dropoffLatInput), dLon = parseFloat(dropoffLonInput);
    if (!isNaN(pLat) && !isNaN(pLon)) setPickup([pLat, pLon]);
    if (!isNaN(dLat) && !isNaN(dLon)) setDropoff([dLat, dLon]);
  };

  const resetMap = () => {
    setAiRoute([]); setOsrmRoute([]);
    setAiDistance(0); setOsrmDistance(0);
    setAiEta(0); setOsrmEta(0);
    setAiError(null); setOsrmError(null);
    setAiFallback(false); setClickMode(null);
  };

  const diffPct = osrmDistance > 0 && aiDistance > 0
    ? Math.round(((aiDistance - osrmDistance) / osrmDistance) * 100)
    : null;

  const filteredPickup  = KUWAIT_CITIES.filter(c => c.name.toLowerCase().includes(pickupSearch.toLowerCase()));
  const filteredDropoff = KUWAIT_CITIES.filter(c => c.name.toLowerCase().includes(dropoffSearch.toLowerCase()));

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>

      {/* ── Control panel ── */}
      <div style={panelStyle}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: "#e2e8f0" }}>
          🗺️ Itinéraire — Kuwait
        </div>

        {/* API Key */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>API Key</label>
          <input
            type="password"
            placeholder="Enter your API key..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 12, boxSizing: 'border-box' }}
          />
        </div>

        {/* Départ */}
        <div style={sectionStyle}>
          <label style={labelStyle}>🟢 Départ</label>
          <div style={{ position: "relative" }}>
            <button style={cityBtnStyle} onClick={() => { setPickupCityOpen(o => !o); setDropoffCityOpen(false); }}>
              <span>{pickupCityName || "Choisir..."}</span>
              <span style={{ fontSize: 10 }}>{pickupCityOpen ? "▲" : "▼"}</span>
            </button>
            {pickupCityOpen && (
              <div style={dropdownStyle}>
                <input autoFocus style={searchInputStyle} placeholder="Rechercher..." value={pickupSearch} onChange={e => setPickupSearch(e.target.value)} />
                {filteredPickup.map(c => (
                  <div key={c.name} style={{ ...dropdownItemStyle, background: c.name === pickupCityName ? "rgba(59,130,246,0.15)" : "transparent" }} onClick={() => handlePickupCity(c)}>
                    📍 {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={rowStyle}>
            <input style={{ ...inputStyle, width: "48%" }} placeholder="Lat" value={pickupLatInput}  onChange={e => setPickupLatInput(e.target.value)}  />
            <input style={{ ...inputStyle, width: "48%" }} placeholder="Lon" value={pickupLonInput}  onChange={e => setPickupLonInput(e.target.value)}  />
          </div>
          <button
            style={{ ...smallBtnStyle, width: "100%", background: clickMode === "pickup" ? "#3b82f6" : "rgba(255,255,255,0.06)", color: clickMode === "pickup" ? "white" : "#94a3b8" }}
            onClick={() => setClickMode(clickMode === "pickup" ? null : "pickup")}
          >
            {clickMode === "pickup" ? "✅ Cliquez sur la carte..." : "📍 Clic sur la carte"}
          </button>
        </div>

        {/* Arrivée */}
        <div style={sectionStyle}>
          <label style={labelStyle}>🔴 Arrivée</label>
          <div style={{ position: "relative" }}>
            <button style={cityBtnStyle} onClick={() => { setDropoffCityOpen(o => !o); setPickupCityOpen(false); }}>
              <span>{dropoffCityName || "Choisir..."}</span>
              <span style={{ fontSize: 10 }}>{dropoffCityOpen ? "▲" : "▼"}</span>
            </button>
            {dropoffCityOpen && (
              <div style={dropdownStyle}>
                <input autoFocus style={searchInputStyle} placeholder="Rechercher..." value={dropoffSearch} onChange={e => setDropoffSearch(e.target.value)} />
                {filteredDropoff.map(c => (
                  <div key={c.name} style={{ ...dropdownItemStyle, background: c.name === dropoffCityName ? "rgba(239,68,68,0.12)" : "transparent" }} onClick={() => handleDropoffCity(c)}>
                    📍 {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={rowStyle}>
            <input style={{ ...inputStyle, width: "48%" }} placeholder="Lat" value={dropoffLatInput} onChange={e => setDropoffLatInput(e.target.value)} />
            <input style={{ ...inputStyle, width: "48%" }} placeholder="Lon" value={dropoffLonInput} onChange={e => setDropoffLonInput(e.target.value)} />
          </div>
          <button
            style={{ ...smallBtnStyle, width: "100%", background: clickMode === "dropoff" ? "#ef4444" : "rgba(255,255,255,0.06)", color: clickMode === "dropoff" ? "white" : "#94a3b8" }}
            onClick={() => setClickMode(clickMode === "dropoff" ? null : "dropoff")}
          >
            {clickMode === "dropoff" ? "✅ Cliquez sur la carte..." : "📍 Clic sur la carte"}
          </button>
        </div>

        <button style={primaryBtnStyle} onClick={applyCoords} disabled={loading}>
          {loading ? "⏳ Calcul..." : "🚀 Calculer"}
        </button>
        <button style={resetBtnStyle} onClick={resetMap}>🔄 Réinitialiser</button>

        {/* Layer toggles */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button style={{ ...toggleBtnStyle, background: showAi ? (aiFallback ? "#f97316" : "#3b82f6") : "rgba(255,255,255,0.06)", color: showAi ? "white" : "#64748b" }}
            onClick={() => setShowAi(v => !v)}>
            🤖 AI
          </button>
          <button style={{ ...toggleBtnStyle, background: showOsrm ? "#22c55e" : "rgba(255,255,255,0.06)", color: showOsrm ? "white" : "#64748b" }}
            onClick={() => setShowOsrm(v => !v)}>
            OSRM
          </button>
        </div>

        {/* Results */}
        {(aiDistance > 0 || osrmDistance > 0) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {aiDistance > 0 && (
              <div style={{ ...resultStyle, borderLeft: `3px solid ${aiFallback ? "#f97316" : "#3b82f6"}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: aiFallback ? "#f97316" : "#3b82f6", marginBottom: 2 }}>
                  🤖 Notre AI {aiFallback ? "⚠️ estimé" : "✅"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#e2e8f0" }}>
                  <span>📏 {(aiDistance / 1000).toFixed(2)} km</span>
                  <span>⏱️ {aiEta.toFixed(0)} min</span>
                </div>
              </div>
            )}
            {osrmDistance > 0 && (
              <div style={{ ...resultStyle, borderLeft: "3px solid #22c55e" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", marginBottom: 2 }}>🗺️ OSRM (référence)</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#e2e8f0" }}>
                  <span>📏 {(osrmDistance / 1000).toFixed(2)} km</span>
                  <span>⏱️ {osrmEta.toFixed(0)} min</span>
                </div>
              </div>
            )}
            {diffPct !== null && (
              <div style={{
                padding: "8px 10px", borderRadius: 8, textAlign: "center",
                background: Math.abs(diffPct) < 15 ? "rgba(34,197,94,0.1)" : Math.abs(diffPct) < 40 ? "rgba(249,115,22,0.1)" : "rgba(239,68,68,0.1)",
                fontSize: 12, fontWeight: 600,
                color: Math.abs(diffPct) < 15 ? "#22c55e" : Math.abs(diffPct) < 40 ? "#f97316" : "#ef4444",
              }}>
                {Math.abs(diffPct) < 15 ? `✅ Précision excellente (+${diffPct}%)` : Math.abs(diffPct) < 40 ? `⚠️ AI +${diffPct}% vs OSRM` : `❌ AI +${diffPct}% vs OSRM`}
              </div>
            )}
          </div>
        )}

        {(aiError || osrmError) && (
          <div style={errorBoxStyle}>
            {aiError   && <div>🤖 {aiError}</div>}
            {osrmError && <div>🗺️ {osrmError}</div>}
          </div>
        )}
      </div>

      {/* ── Map canvas ── */}
      <ArmadaMap
        center={mapCenter}
        zoom={12}
        height="100%"
        style={{ position: "absolute", inset: 0 }}
        className={clickMode ? "armada-map-crosshair" : undefined}
      >
        <ClickHandler
          mode={clickMode}
          setPickup={p  => { setPickup(p);  setClickMode(null); }}
          setDropoff={d => { setDropoff(d); setClickMode(null); }}
        />
        <RecenterMap center={mapCenter} />

        <Marker position={pickup}  icon={pickupIcon}>  <Popup>Départ {pickupCityName  && `— ${pickupCityName}`}</Popup>  </Marker>
        <Marker position={dropoff} icon={dropoffIcon}><Popup>Arrivée {dropoffCityName && `— ${dropoffCityName}`}</Popup></Marker>

        {showOsrm && osrmRoute.length > 0 && (
          <Polyline positions={osrmRoute} color="#22c55e" weight={4} opacity={0.85} dashArray="8 5" />
        )}
        {showAi && aiRoute.length > 0 && (
          <Polyline positions={aiRoute} color={aiFallback ? "#f97316" : "#3b82f6"} weight={4} opacity={0.9} />
        )}
        {driverPosition && (
          <Marker position={driverPosition} icon={driverIcon} zIndexOffset={1000}>
            <Popup>Your location</Popup>
          </Marker>
        )}
      </ArmadaMap>

      {/* ── Legend ── */}
      <div style={legendStyle}>
        <div style={{ fontWeight: 600, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Legend</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 22, height: 3, background: "#3b82f6", borderRadius: 2 }}/>
          <span>Armada AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 22, height: 0, borderTop: "3px dashed #22c55e" }}/>
          <span>OSRM ref</span>
        </div>
      </div>

      {clickMode && (
        <div style={hintStyle}>
          {clickMode === "pickup" ? "🟢 Cliquez pour le départ" : "🔴 Cliquez pour l'arrivée"}
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  position: "absolute", top: 10, left: 10, zIndex: 1000,
  background: "rgba(15,23,42,0.92)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, padding: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  width: 280, color: "#e2e8f0",
  display: "flex", flexDirection: "column", gap: 8,
  maxHeight: "95vh", overflowY: "auto",
};
const sectionStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 8, padding: 10,
  display: "flex", flexDirection: "column", gap: 6,
};
const labelStyle: React.CSSProperties = { fontWeight: 600, fontSize: 13, color: "#cbd5e1" };
const rowStyle: React.CSSProperties = { display: "flex", gap: 6 };
const inputStyle: React.CSSProperties = {
  padding: "5px 8px", borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#e2e8f0", fontSize: 12,
};
const cityBtnStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#e2e8f0", cursor: "pointer",
  display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12,
};
const dropdownStyle: React.CSSProperties = {
  position: "absolute", top: "100%", left: 0, right: 0,
  background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  zIndex: 2000, maxHeight: 180, overflowY: "auto", marginTop: 4,
};
const searchInputStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px",
  border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "transparent", color: "#e2e8f0",
  fontSize: 12, outline: "none", boxSizing: "border-box",
};
const dropdownItemStyle: React.CSSProperties = {
  padding: "7px 12px", cursor: "pointer", fontSize: 12, color: "#cbd5e1",
};
const smallBtnStyle: React.CSSProperties = {
  padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer", fontSize: 12,
};
const toggleBtnStyle: React.CSSProperties = {
  flex: 1, padding: "7px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer", fontSize: 11, fontWeight: 600, minWidth: 0,
};
const primaryBtnStyle: React.CSSProperties = {
  padding: "10px", borderRadius: 8, border: "none",
  background: "#3b82f6", color: "white", fontWeight: 600,
  cursor: "pointer", fontSize: 14,
};
const resetBtnStyle: React.CSSProperties = {
  padding: "8px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#94a3b8", cursor: "pointer", fontSize: 13,
};
const resultStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  borderRadius: 8, padding: "8px 10px",
};
const errorBoxStyle: React.CSSProperties = {
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.2)",
  color: "#fca5a5", borderRadius: 8, padding: 8, fontSize: 12,
};
const legendStyle: React.CSSProperties = {
  position: "absolute", bottom: 30, right: 10, zIndex: 1000,
  background: "rgba(15,23,42,0.88)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, padding: "8px 12px",
  fontSize: 12, color: "#94a3b8",
  display: "flex", flexDirection: "column", gap: 5,
};
const hintStyle: React.CSSProperties = {
  position: "absolute", bottom: 30, left: "50%",
  transform: "translateX(-50%)", zIndex: 1001,
  background: "rgba(0,0,0,0.8)", color: "white",
  padding: "10px 20px", borderRadius: 20, fontSize: 14,
  backdropFilter: "blur(8px)",
};
