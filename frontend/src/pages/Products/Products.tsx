import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Home/components/Header';
import Footer from '../Home/components/Footer';
import './Products.scss';

const APIS = [
  {
    id: 'eta',
    icon: '⏱',
    name: 'ETA Estimation API',
    tagline: 'Predict delivery times with sub-second precision',
    description:
      'Calculate accurate estimated time of arrival between any two coordinates in Kuwait and across MENA. Powered by real-time traffic data and machine learning models trained on regional road networks.',
    endpoint: 'POST /v1/eta',
    features: [
      'Real-time traffic awareness',
      'Sub-second response times',
      'Historical pattern learning',
      'Multi-waypoint support',
    ],
    credits: '1 credit / request',
    badge: 'Most Popular',
  },
  {
    id: 'distance',
    icon: '📏',
    name: 'Distance Calculation API',
    tagline: 'Accurate road distances between any two points',
    description:
      'Get precise driving distances using an optimized road-network graph covering Kuwait and the wider MENA region. Supports road-following and straight-line (haversine) modes.',
    endpoint: 'POST /v1/distance',
    features: [
      'Road-network distance',
      'Haversine fallback mode',
      'Batch requests (up to 100 pairs)',
      'Kilometers and miles output',
    ],
    credits: '1 credit / request',
    badge: null,
  },
  {
    id: 'combined',
    icon: '⚡',
    name: 'Combined API',
    tagline: 'ETA + Distance in a single optimized call',
    description:
      'Retrieve both ETA and distance data in one request. Reduces latency and costs 1.5 credits instead of 2 — the most efficient option for enriching delivery records.',
    endpoint: 'POST /v1/combined',
    features: [
      'ETA + distance in one call',
      '1.5 credits vs 2 separate calls',
      'Lowest end-to-end latency',
      'Same accuracy guarantee',
    ],
    credits: '1.5 credits / request',
    badge: 'Best Value',
  },
  {
    id: 'route',
    icon: '🗺️',
    name: 'Route Optimizer API',
    tagline: 'AI-powered optimal route planning',
    description:
      'Find the fastest, most fuel-efficient route across multiple stops using the Armada AI road graph and A* pathfinding. Purpose-built for last-mile delivery businesses in Kuwait.',
    endpoint: 'POST /v1/route-prediction',
    features: [
      'Multi-stop route optimization',
      'A* pathfinding on Armada graph',
      'OSRM benchmark comparison',
      'Turn-by-turn waypoints',
    ],
    credits: '3 credits / request',
    badge: 'AI Powered',
  },
];

const Products: React.FC = () => (
  <div className="products-page">
    <Header />

    <main>
      <section className="products-hero">
        <div className="products-container">
          <div className="products-hero__badge">API Products</div>
          <h1 className="products-hero__title">
            Four APIs.{' '}
            <span className="products-hero__accent">One platform.</span>
          </h1>
          <p className="products-hero__subtitle">
            Everything you need to power delivery logistics across Kuwait and
            MENA — from ETA estimation to full route optimization.
          </p>
        </div>
      </section>

      <section className="products-grid-section">
        <div className="products-container">
          <div className="products-grid">
            {APIS.map((api) => (
              <div key={api.id} className="product-card">
                {api.badge && (
                  <span className="product-card__badge">{api.badge}</span>
                )}
                <div className="product-card__icon">{api.icon}</div>
                <h2 className="product-card__name">{api.name}</h2>
                <p className="product-card__tagline">{api.tagline}</p>
                <p className="product-card__description">{api.description}</p>
                <div className="product-card__endpoint">
                  <code>{api.endpoint}</code>
                </div>
                <ul className="product-card__features">
                  {api.features.map((f) => (
                    <li key={f}>
                      <span className="product-card__check">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="product-card__footer">
                  <span className="product-card__credits">{api.credits}</span>
                  <Link to="/docs" className="product-card__link">
                    View docs →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="products-cta">
        <div className="products-container">
          <h2 className="products-cta__title">Ready to integrate?</h2>
          <p className="products-cta__subtitle">
            Start with 500 free credits. No credit card required.
          </p>
          <div className="products-cta__actions">
            <Link to="/signup" className="products-btn products-btn--primary">
              Get started free
            </Link>
            <Link to="/docs" className="products-btn products-btn--outline">
              Read the docs
            </Link>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default Products;
