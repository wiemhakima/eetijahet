import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './Features.scss';

const Features: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const featuresRef = useRef<HTMLElement>(null);

  const features = [
    {
      id: 'precision',
      icon: '🎯',
      title: t('features.precision.title'),
      description: t('features.precision.description'),
      stats: t('features.precision.stats'),
    },
    {
      id: 'realtime',
      icon: '⏱️',
      title: t('features.realtime.title'),
      description: t('features.realtime.description'),
      stats: t('features.realtime.stats'),
    },
    {
      id: 'prediction',
      icon: '📈',
      title: t('features.prediction.title'),
      description: t('features.prediction.description'),
      stats: t('features.prediction.stats'),
    },
    {
      id: 'integration',
      icon: '🔗',
      title: t('features.integration.title'),
      description: t('features.integration.description'),
      stats: t('features.integration.stats'),
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      ref={featuresRef}
      className={`features ${isVisible ? 'features--visible' : ''}`}
    >
      <div className="features__container">
        {/* Section Header */}
        <div className="features__header">
          <div className="features__badge">
            <span className="features__badge-icon">⚡</span>
            <span>{t('features.badge')}</span>
          </div>
          <h2 className="features__title">
            {t('features.title')} <span className="features__title-highlight">{t('features.titleHighlight')}</span>
            <br />
            {t('features.titleFor')} <span className="features__title-modern">{t('features.titleModern')}</span> Logistics
          </h2>
          <p className="features__subtitle">
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="features__grid">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="features__card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="features__icon">
                <span className="features__icon-emoji">{feature.icon}</span>
              </div>

              {/* Content */}
              <div className="features__content">
                <h3 className="features__card-title">{feature.title}</h3>
                <p className="features__card-description">{feature.description}</p>

                {/* Stats */}
                <div className="features__stats">
                  <div className="features__stat-badge">
                    <span className="features__stat-icon">📊</span>
                    <span className="features__stat-text">{feature.stats}</span>
                  </div>
                </div>

                {/* Learn More Button */}
                <button className="features__learn-more">
                  <span>{t('features.learnMore')}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
