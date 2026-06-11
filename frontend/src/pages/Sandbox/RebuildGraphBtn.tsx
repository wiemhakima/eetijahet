import React, { useEffect, useRef, useState } from 'react';

interface GraphStatus {
  running:    boolean;
  message:    string;
  last_build: string | null;
  nodes:      number;
  edges:      number;
  loaded:     boolean;
}

interface GraphInfo {
  source:                   string;   // "osmnx" | "historical" | "unknown"
  version:                  string;
  geomEdges:                number;
  isOsmnx:                  boolean;
  sample_edge_has_waypoints: boolean;
  action_needed:            string | null;
}

const API = 'http://127.0.0.1:3000';

const RebuildGraphBtn: React.FC = () => {
  const [status,     setStatus]     = useState<GraphStatus | null>(null);
  const [info,       setInfo]       = useState<GraphInfo | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const hasLoaded = useRef(false);   // once-only guard — no retry on 502/timeout

  const fetchStatus = async () => {
    const ctrl    = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);
    try {
      const [sRes, iRes] = await Promise.all([
        fetch(`${API}/graph_status`, { signal: ctrl.signal }),
        fetch(`${API}/graph_info`,   { signal: ctrl.signal }),
      ]);
      if (sRes.ok) setStatus(await sRes.json() as GraphStatus);
      if (iRes.ok) setInfo(await iRes.json() as GraphInfo);
    } catch {
      // 502, timeout, network error → silent, no retry, no setState
    } finally {
      clearTimeout(timeout);
    }
  };

  // Single call on mount — hasLoaded prevents any re-execution
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    fetchStatus();
  }, []);

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const res  = await fetch(`${API}/rebuild_graph`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ use_osmnx: true }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    } catch (e) {
      console.error('Rebuild error:', e);
    } finally {
      setRebuilding(false);
      fetchStatus();
    }
  };

  const fmt = (iso: string | null) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  const isRunning = status?.running || rebuilding;

  // Badge de source du graphe
  const sourceBadge = info ? (
    info.isOsmnx
      ? { label: 'OSMnx ✓', color: '#22c55e' }
      : { label: info.source === 'historical' ? 'Historique ⚠' : 'Inconnu ⚠', color: '#f97316' }
  ) : null;

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={headerStyle}>Graph Status</div>
        {sourceBadge && (
          <span style={{ fontSize: '0.68rem', fontWeight: 700,
            color: sourceBadge.color, border: `1px solid ${sourceBadge.color}`,
            borderRadius: '4px', padding: '1px 5px' }}>
            {sourceBadge.label}
          </span>
        )}
      </div>

      <div style={rowStyle}>
        <Stat label="Nœuds"  value={status ? status.nodes.toLocaleString() : '…'} />
        <Stat label="Arêtes" value={status ? status.edges.toLocaleString() : '…'} />
        {info && (
          <Stat label="Courbes" value={info.geomEdges > 0 ? info.geomEdges.toLocaleString() : '0'} />
        )}
      </div>

      {/* Avertissement si graphe non-OSMnx */}
      {info && !info.isOsmnx && (
        <div style={warnStyle}>
          ⚠ Graphe historique chargé — la route ne suivra pas les rues OSM.
          Lancez un Rebuild.
        </div>
      )}

      {/* Message de progression du rebuild */}
      {status?.message && status.message !== 'idle' && (
        <div style={msgStyle(status.message.startsWith('Erreur'))}>
          {isRunning && <span style={spinnerStyle} />}
          {status.message}
        </div>
      )}

      <div style={lastBuiltStyle}>
        Dernier build : <span style={{ fontWeight: 600 }}>{fmt(status?.last_build ?? null)}</span>
      </div>

      <button onClick={handleRebuild} disabled={isRunning} style={btnStyle(isRunning)}>
        {isRunning ? '⏳ Rebuild en cours…' : '🔄 Rebuild Graph (OSMnx)'}
      </button>

      {info?.action_needed && (
        <div style={actionStyle}>{info.action_needed}</div>
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────
const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={statBoxStyle}>
    <span style={{ fontSize: '0.65rem', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>{value}</span>
  </div>
);

// ── Styles ────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.5rem',
  padding: '0.75rem', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
};
const headerStyle: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 600,
  opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em',
};
const rowStyle: React.CSSProperties = { display: 'flex', gap: '0.4rem' };
const statBoxStyle: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem',
  padding: '0.35rem 0.45rem', borderRadius: '6px',
  background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
};
const lastBuiltStyle: React.CSSProperties = { fontSize: '0.71rem', opacity: 0.5 };
const btnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '0.45rem', borderRadius: '7px', border: 'none',
  background: disabled ? 'rgba(168,85,247,0.3)' : '#a855f7',
  color: '#fff', fontWeight: 600, fontSize: '0.84rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
});
const msgStyle = (isError: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.35rem 0.5rem', borderRadius: '6px', fontSize: '0.73rem',
  background: isError ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.1)',
  border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.25)'}`,
  color: isError ? '#f87171' : 'inherit',
  wordBreak: 'break-word',
});
const warnStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem', borderRadius: '6px', fontSize: '0.73rem',
  background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
  color: '#fb923c',
};
const actionStyle: React.CSSProperties = {
  fontSize: '0.72rem', opacity: 0.6, fontStyle: 'italic',
};
const spinnerStyle: React.CSSProperties = {
  display: 'inline-block', width: '10px', height: '10px', flexShrink: 0,
  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#60a5fa',
  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
};

export default RebuildGraphBtn;
