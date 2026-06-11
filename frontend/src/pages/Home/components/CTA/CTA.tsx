import React from 'react';
import Button from '../../../../components/Button';
import './CTA.scss';

export const CTA: React.FC = () => {
  return (
    <section className="cta">
      <div className="cta__container">
        <div className="cta__content">
          <div className="cta__text">
            <h2 className="cta__title">
              Ready to build the future of logistics?
            </h2>
            <p className="cta__description">
              Join thousands of developers who trust our APIs to power their logistics applications. 
              Start building today with our free tier and scale as you grow.
            </p>
            <div className="cta__features">
              <div className="cta__feature">
                <div className="cta__feature-icon">✓</div>
                <span>Free tier with 10,000 API calls/month</span>
              </div>
              <div className="cta__feature">
                <div className="cta__feature-icon">✓</div>
                <span>No setup fees or hidden costs</span>
              </div>
              <div className="cta__feature">
                <div className="cta__feature-icon">✓</div>
                <span>24/7 developer support</span>
              </div>
            </div>
          </div>
          
          <div className="cta__actions">
            <Button variant="primary" size="large" className="cta__btn-primary">
              Start building for free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            <Button variant="secondary" size="large" className="cta__btn-secondary">
              Talk to sales
            </Button>
          </div>
        </div>

        <div className="cta__visual">
          <div className="cta__code-block">
            <div className="cta__code-header">
              <div className="cta__code-controls">
                <div className="cta__code-control cta__code-control--red"></div>
                <div className="cta__code-control cta__code-control--yellow"></div>
                <div className="cta__code-control cta__code-control--green"></div>
              </div>
              <div className="cta__code-title">Quick Start</div>
            </div>
            <div className="cta__code-content">
              <pre className="cta__code">
{`// Install the SDK
npm install @etijahat/logistics-api

// Initialize the client
import { EtijahatAPI } from '@etijahat/logistics-api';

const client = new EtijahatAPI({
  apiKey: 'your-api-key'
});

// Get ETA estimation
const eta = await client.eta.estimate({
  origin: '33.8938,35.5018',
  destination: '33.8869,35.5131',
  vehicleType: 'car'
});

console.log(\`ETA: \${eta.duration} minutes\`);`}
              </pre>
            </div>
          </div>

          <div className="cta__stats">
            <div className="cta__stat">
              <div className="cta__stat-value">5 min</div>
              <div className="cta__stat-label">Setup time</div>
            </div>
            <div className="cta__stat">
              <div className="cta__stat-value">99.9%</div>
              <div className="cta__stat-label">Uptime SLA</div>
            </div>
            <div className="cta__stat">
              <div className="cta__stat-value">24/7</div>
              <div className="cta__stat-label">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="cta__bg-elements">
        <div className="cta__bg-element cta__bg-element--1"></div>
        <div className="cta__bg-element cta__bg-element--2"></div>
        <div className="cta__bg-element cta__bg-element--3"></div>
      </div>
    </section>
  );
};

export default CTA;
