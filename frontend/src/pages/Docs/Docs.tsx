import React, { useState } from 'react';
import Header from '../Home/components/Header';
import Footer from '../Home/components/Footer';
import { Link } from 'react-router-dom';
import './Docs.scss';

const ENDPOINTS = [
  {
    id: 'eta',
    method: 'POST',
    path: '/v1/eta',
    title: 'ETA Estimation',
    description: 'Calculates the estimated travel time between an origin and a destination.',
    credits: 1,
    request: `{
  "origin": {
    "lat": 29.3759,
    "lng": 47.9774
  },
  "destination": {
    "lat": 29.3484,
    "lng": 48.0827
  }
}`,
    response: `{
  "eta_seconds": 1140,
  "eta_minutes": 19,
  "distance_km": 14.3,
  "traffic_factor": 1.2,
  "timestamp": "2025-01-15T10:30:00Z"
}`,
    params: [
      { name: 'origin.lat', type: 'number', required: true, desc: 'Latitude of the origin point' },
      { name: 'origin.lng', type: 'number', required: true, desc: 'Longitude of the origin point' },
      { name: 'destination.lat', type: 'number', required: true, desc: 'Latitude of the destination' },
      { name: 'destination.lng', type: 'number', required: true, desc: 'Longitude of the destination' },
    ],
  },
  {
    id: 'distance',
    method: 'POST',
    path: '/v1/distance',
    title: 'Distance Calculation',
    description: 'Returns the road-network driving distance between two geographic points.',
    credits: 1,
    request: `{
  "origin": { "lat": 29.3759, "lng": 47.9774 },
  "destination": { "lat": 29.3484, "lng": 48.0827 },
  "mode": "driving"
}`,
    response: `{
  "distance_km": 14.3,
  "distance_miles": 8.89,
  "road_distance_km": 16.1,
  "mode": "driving"
}`,
    params: [
      { name: 'origin.lat', type: 'number', required: true, desc: 'Latitude of the origin' },
      { name: 'origin.lng', type: 'number', required: true, desc: 'Longitude of the origin' },
      { name: 'destination.lat', type: 'number', required: true, desc: 'Latitude of the destination' },
      { name: 'destination.lng', type: 'number', required: true, desc: 'Longitude of the destination' },
      { name: 'mode', type: 'string', required: false, desc: '"driving" (default) or "haversine"' },
    ],
  },
  {
    id: 'combined',
    method: 'POST',
    path: '/v1/combined',
    title: 'Combined API',
    description: 'Returns both ETA and distance in a single optimized call at 1.5 credits.',
    credits: 1.5,
    request: `{
  "origin": { "lat": 29.3759, "lng": 47.9774 },
  "destination": { "lat": 29.3484, "lng": 48.0827 }
}`,
    response: `{
  "eta_seconds": 1140,
  "eta_minutes": 19,
  "distance_km": 14.3,
  "road_distance_km": 16.1,
  "traffic_factor": 1.2
}`,
    params: [
      { name: 'origin.lat', type: 'number', required: true, desc: 'Latitude of the origin' },
      { name: 'origin.lng', type: 'number', required: true, desc: 'Longitude of the origin' },
      { name: 'destination.lat', type: 'number', required: true, desc: 'Latitude of the destination' },
      { name: 'destination.lng', type: 'number', required: true, desc: 'Longitude of the destination' },
    ],
  },
  {
    id: 'route',
    method: 'POST',
    path: '/v1/route-prediction',
    title: 'Route Optimizer',
    description: 'Returns the optimal driving route between origin and destination using the Armada AI road graph.',
    credits: 3,
    request: `{
  "origin": { "lat": 29.3759, "lng": 47.9774 },
  "destination": { "lat": 29.3484, "lng": 48.0827 },
  "algorithm": "astar"
}`,
    response: `{
  "distance_km": 16.1,
  "duration_seconds": 1140,
  "waypoints": [
    { "lat": 29.3759, "lng": 47.9774 },
    { "lat": 29.3620, "lng": 48.0300 },
    { "lat": 29.3484, "lng": 48.0827 }
  ],
  "algorithm": "astar"
}`,
    params: [
      { name: 'origin.lat', type: 'number', required: true, desc: 'Latitude of start point' },
      { name: 'origin.lng', type: 'number', required: true, desc: 'Longitude of start point' },
      { name: 'destination.lat', type: 'number', required: true, desc: 'Latitude of end point' },
      { name: 'destination.lng', type: 'number', required: true, desc: 'Longitude of end point' },
      { name: 'algorithm', type: 'string', required: false, desc: '"astar" (default) or "osrm"' },
    ],
  },
];

const Docs: React.FC = () => {
  const [active, setActive] = useState('eta');

  const current = ENDPOINTS.find((e) => e.id === active)!;

  return (
    <div className="docs-page">
      <Header />

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-sidebar__section">
            <div className="docs-sidebar__label">Getting Started</div>
            <a href="#authentication" className="docs-sidebar__link">Authentication</a>
            <a href="#rate-limits" className="docs-sidebar__link">Rate Limits</a>
            <a href="#errors" className="docs-sidebar__link">Error Codes</a>
          </div>
          <div className="docs-sidebar__section">
            <div className="docs-sidebar__label">API Reference</div>
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.id}
                className={`docs-sidebar__link ${active === ep.id ? 'docs-sidebar__link--active' : ''}`}
                onClick={() => setActive(ep.id)}
              >
                <span className={`docs-sidebar__method docs-sidebar__method--post`}>
                  POST
                </span>
                {ep.title}
              </button>
            ))}
          </div>
          <div className="docs-sidebar__section">
            <div className="docs-sidebar__label">Resources</div>
            <Link to="/support" className="docs-sidebar__link">Support</Link>
            <Link to="/pricing" className="docs-sidebar__link">Pricing & Credits</Link>
          </div>
        </aside>

        <main className="docs-main">
          <section className="docs-auth" id="authentication">
            <h1 className="docs-main__title">API Documentation</h1>
            <p className="docs-main__intro">
              The Etijahat API uses bearer token authentication. Include your API key in every request header.
            </p>
            <div className="docs-code">
              <div className="docs-code__header">
                <span>Authentication header</span>
              </div>
              <pre className="docs-code__body">
                <code>{`Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json`}</code>
              </pre>
            </div>
          </section>

          <section className="docs-endpoint">
            <div className="docs-endpoint__title-row">
              <span className="docs-endpoint__method">POST</span>
              <code className="docs-endpoint__path">{current.path}</code>
              <span className="docs-endpoint__credits">{current.credits} credit{current.credits !== 1 ? 's' : ''}</span>
            </div>
            <h2 className="docs-endpoint__name">{current.title}</h2>
            <p className="docs-endpoint__desc">{current.description}</p>

            <h3 className="docs-section-title">Parameters</h3>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {current.params.map((p) => (
                    <tr key={p.name}>
                      <td><code>{p.name}</code></td>
                      <td><span className="docs-type">{p.type}</span></td>
                      <td>{p.required ? <span className="docs-required">Yes</span> : <span className="docs-optional">No</span>}</td>
                      <td>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="docs-code-pair">
              <div className="docs-code">
                <div className="docs-code__header"><span>Request body</span></div>
                <pre className="docs-code__body"><code>{current.request}</code></pre>
              </div>
              <div className="docs-code">
                <div className="docs-code__header"><span>Response</span></div>
                <pre className="docs-code__body"><code>{current.response}</code></pre>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Docs;
