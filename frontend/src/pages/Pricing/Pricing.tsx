import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Home/components/Header';
import Footer from '../Home/components/Footer';
import './Pricing.scss';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    desc: 'For side projects and testing',
    monthlyPrice: 0,
    annualPrice: 0,
    credits: 500,
    badge: null,
    highlight: false,
    features: [
      '500 credits / month',
      'All 4 APIs included',
      'Sandbox environment',
      'Community support',
      '100 req/min rate limit',
    ],
    cta: 'Get started free',
    ctaLink: '/signup',
  },
  {
    id: 'growth',
    name: 'Growth',
    desc: 'For growing delivery businesses',
    monthlyPrice: 49,
    annualPrice: 39,
    credits: 10000,
    badge: null,
    highlight: false,
    features: [
      '10,000 credits / month',
      'All 4 APIs included',
      'Webhook notifications',
      'Email support (24h SLA)',
      '500 req/min rate limit',
    ],
    cta: 'Start free trial',
    ctaLink: '/signup',
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'For production-scale platforms',
    monthlyPrice: 149,
    annualPrice: 119,
    credits: 50000,
    badge: 'Most Popular',
    highlight: true,
    features: [
      '50,000 credits / month',
      'All 4 APIs included',
      'Priority routing engine',
      'Priority support (4h SLA)',
      '2,000 req/min rate limit',
    ],
    cta: 'Start free trial',
    ctaLink: '/signup',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    desc: 'Custom volume & SLA for large teams',
    monthlyPrice: null,
    annualPrice: null,
    credits: null,
    badge: null,
    highlight: false,
    features: [
      'Unlimited credits',
      'Dedicated infrastructure',
      'Custom SLA & uptime guarantee',
      'Dedicated solutions engineer',
      'Custom rate limits',
    ],
    cta: 'Contact sales',
    ctaLink: '/support',
  },
];

const Pricing: React.FC = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="pricing-page">
      <Header />

      <main>
        <section className="pricing-hero">
          <div className="pricing-container">
            <div className="pricing-hero__badge">Pricing</div>
            <h1 className="pricing-hero__title">
              Simple, transparent pricing
            </h1>
            <p className="pricing-hero__subtitle">
              Pay for what you use. No hidden fees. Start free and scale as you grow.
            </p>

            <div className="pricing-toggle">
              <span className={!annual ? 'pricing-toggle__label pricing-toggle__label--active' : 'pricing-toggle__label'}>
                Monthly
              </span>
              <button
                className={`pricing-toggle__btn ${annual ? 'pricing-toggle__btn--on' : ''}`}
                onClick={() => setAnnual(!annual)}
                aria-label="Toggle annual billing"
              >
                <span className="pricing-toggle__knob" />
              </button>
              <span className={annual ? 'pricing-toggle__label pricing-toggle__label--active' : 'pricing-toggle__label'}>
                Annual <span className="pricing-toggle__save">Save 20%</span>
              </span>
            </div>
          </div>
        </section>

        <section className="pricing-plans-section">
          <div className="pricing-container">
            <div className="pricing-plans">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`pricing-card ${plan.highlight ? 'pricing-card--highlight' : ''}`}
                >
                  {plan.badge && (
                    <span className="pricing-card__badge">{plan.badge}</span>
                  )}
                  <div className="pricing-card__header">
                    <h2 className="pricing-card__name">{plan.name}</h2>
                    <p className="pricing-card__desc">{plan.desc}</p>
                  </div>

                  <div className="pricing-card__price">
                    {plan.monthlyPrice === null ? (
                      <span className="pricing-card__price-custom">Custom</span>
                    ) : plan.monthlyPrice === 0 ? (
                      <span className="pricing-card__price-amount">Free</span>
                    ) : (
                      <>
                        <span className="pricing-card__price-currency">$</span>
                        <span className="pricing-card__price-amount">
                          {annual ? plan.annualPrice : plan.monthlyPrice}
                        </span>
                        <span className="pricing-card__price-period">/mo</span>
                      </>
                    )}
                  </div>

                  {plan.credits && (
                    <div className="pricing-card__credits">
                      {plan.credits.toLocaleString()} credits / month
                    </div>
                  )}

                  <ul className="pricing-card__features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <span className="pricing-card__check">✓</span> {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.ctaLink}
                    className={`pricing-card__cta ${plan.highlight ? 'pricing-card__cta--primary' : 'pricing-card__cta--outline'}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pricing-faq">
          <div className="pricing-container">
            <h2 className="pricing-faq__title">Frequently asked questions</h2>
            <div className="pricing-faq__grid">
              <div className="pricing-faq__item">
                <h3>What is a credit?</h3>
                <p>One credit equals one successful API call. ETA and Distance APIs cost 1 credit, Combined costs 1.5, and Route Optimizer costs 3 credits per request.</p>
              </div>
              <div className="pricing-faq__item">
                <h3>Do unused credits roll over?</h3>
                <p>Credits reset at the start of each billing cycle and do not roll over. Enterprise plans can negotiate custom rollover policies.</p>
              </div>
              <div className="pricing-faq__item">
                <h3>Can I upgrade or downgrade anytime?</h3>
                <p>Yes — plan changes take effect immediately. When upgrading, you're charged the prorated difference for the rest of your billing cycle.</p>
              </div>
              <div className="pricing-faq__item">
                <h3>Is there a free trial for paid plans?</h3>
                <p>Yes. Growth and Pro plans come with a 14-day free trial. No credit card required to start.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
