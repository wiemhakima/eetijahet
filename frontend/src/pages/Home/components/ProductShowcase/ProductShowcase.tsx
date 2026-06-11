import React, { useState } from 'react';
import './ProductShowcase.scss';

interface Product {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  image: string;
  color: string;
}

export const ProductShowcase: React.FC = () => {
  const [activeProduct, setActiveProduct] = useState(0);

  const products: Product[] = [
    {
      id: 'eta-api',
      title: 'ETA Estimation API',
      description: 'Accurate delivery time predictions powered by machine learning algorithms trained on real-world logistics data.',
      icon: '🕒',
      features: [
        'Real-time traffic analysis',
        'Weather condition factors',
        'Historical delivery patterns',
        '99.7% accuracy rate'
      ],
      image: '/src/assets/images/api.jpg',
      color: '#1a73e8'
    },
    {
      id: 'distance-api',
      title: 'Distance Calculation API',
      description: 'Precise distance measurements between multiple locations with support for various routing algorithms.',
      icon: '📏',
      features: [
        'Multiple routing options',
        'Bulk distance calculations',
        'Geographic optimization',
        'Sub-second response times'
      ],
      image: '/src/assets/images/usage.jpg',
      color: '#34a853'
    },
  ];

  return (
    <section className="product-showcase">
      <div className="product-showcase__container">
        <div className="product-showcase__header">
          <h2 className="product-showcase__title">
            Powerful APIs for modern logistics
          </h2>
          <p className="product-showcase__subtitle">
            Everything you need to build world-class delivery and logistics applications
          </p>
        </div>

        <div className="product-showcase__content">
          <div className="product-showcase__tabs">
            {products.map((product, index) => (
              <button
                key={product.id}
                className={`product-showcase__tab ${
                  index === activeProduct ? 'product-showcase__tab--active' : ''
                }`}
                onClick={() => setActiveProduct(index)}
                style={{ '--product-color': product.color } as React.CSSProperties}
              >
                <div className="product-showcase__tab-icon">{product.icon}</div>
                <div className="product-showcase__tab-content">
                  <h3 className="product-showcase__tab-title">{product.title}</h3>
                  <p className="product-showcase__tab-desc">{product.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="product-showcase__display">
            <div className="product-showcase__visual">
              <div className="product-showcase__image-container">
                <img
                  src={products[activeProduct].image}
                  alt={products[activeProduct].title}
                  className="product-showcase__image"
                />
                <div className="product-showcase__image-overlay"></div>
              </div>
              
              <div className="product-showcase__code-preview">
                <div className="product-showcase__code-header">
                  <div className="product-showcase__code-controls">
                    <div className="product-showcase__code-control product-showcase__code-control--red"></div>
                    <div className="product-showcase__code-control product-showcase__code-control--yellow"></div>
                    <div className="product-showcase__code-control product-showcase__code-control--green"></div>
                  </div>
                  <div className="product-showcase__code-title">API Example</div>
                </div>
                <div className="product-showcase__code-content">
                  <pre className="product-showcase__code">
{activeProduct === 0 && `curl -X POST "https://api.etijahat.com/eta" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin": "33.8938,35.5018",
    "destination": "33.8869,35.5131",
    "vehicle_type": "car"
  }'`}
{activeProduct === 1 && `curl -X POST "https://api.etijahat.com/distance" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origins": ["33.8938,35.5018"],
    "destinations": ["33.8869,35.5131"],
    "units": "metric"
  }'`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="product-showcase__details">
              <div className="product-showcase__product-info">
                <div 
                  className="product-showcase__product-icon"
                  style={{ backgroundColor: products[activeProduct].color }}
                >
                  {products[activeProduct].icon}
                </div>
                <div className="product-showcase__product-content">
                  <h3 className="product-showcase__product-title">
                    {products[activeProduct].title}
                  </h3>
                  <p className="product-showcase__product-description">
                    {products[activeProduct].description}
                  </p>
                </div>
              </div>

              <div className="product-showcase__features">
                <h4 className="product-showcase__features-title">Key Features</h4>
                <ul className="product-showcase__features-list">
                  {products[activeProduct].features.map((feature, index) => (
                    <li key={index} className="product-showcase__feature">
                      <div className="product-showcase__feature-icon">✓</div>
                      <span className="product-showcase__feature-text">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="product-showcase__actions">
                <button className="product-showcase__btn product-showcase__btn--primary">
                  Try {products[activeProduct].title}
                </button>
                <button className="product-showcase__btn product-showcase__btn--secondary">
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="product-showcase__stats">
          <div className="product-showcase__stat">
            <div className="product-showcase__stat-value">99.9%</div>
            <div className="product-showcase__stat-label">Uptime SLA</div>
          </div>
          <div className="product-showcase__stat">
            <div className="product-showcase__stat-value">&lt;100ms</div>
            <div className="product-showcase__stat-label">Response Time</div>
          </div>
          <div className="product-showcase__stat">
            <div className="product-showcase__stat-value">150+</div>
            <div className="product-showcase__stat-label">Countries</div>
          </div>
          <div className="product-showcase__stat">
            <div className="product-showcase__stat-value">24/7</div>
            <div className="product-showcase__stat-label">Support</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
