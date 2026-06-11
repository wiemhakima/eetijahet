import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import './Hero.scss';

export const Hero: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, []);

  return (
    <section
      ref={heroRef}
      className={`hero ${isVisible ? 'hero--visible' : ''}`}
    >
      {/* Video Background */}
      <div className="hero__video-container">
        <video
          ref={videoRef}
          className="hero__video"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/src/assets/video/blue-water.mp4" type="video/mp4" />
        </video>
        <div className="hero__video-overlay"></div>
      </div>

      {/* Floating Elements */}
      <div className="hero__floating-elements">
        <div className="hero__floating-element hero__floating-element--1"></div>
        <div className="hero__floating-element hero__floating-element--2"></div>
        <div className="hero__floating-element hero__floating-element--3"></div>
      </div>

      <div className="hero__container">
        <div className="hero__content">
          {/* Status Badge */}
          <div className="hero__badge">
            <div className="hero__badge-dot"></div>
            <span>{t('hero.systemStatus')}</span>
            <div className="hero__badge-metrics">
              <span>{t('hero.uptime')}</span>
              <span>•</span>
              <span>{t('hero.globalInfrastructure')}</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="hero__title">
            <span className="hero__title-main">
              {t('hero.titleMain')}
            </span>
            <span className="hero__title-sub">
              {t('hero.titleSub')}
            </span>
          </h1>

          {/* Description */}
          <p className="hero__description">
            {t('hero.description')}
          </p>

          {/* Action Buttons */}
          <div className="hero__actions">
            <Button variant="primary" size="large" className="hero__cta-primary">
              {t('hero.getStarted')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            <Button variant="secondary" size="large" className="hero__cta-secondary">
              {t('hero.viewDocs')}
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="hero__trust">
            <span className="hero__trust-text">{t('hero.trustedBy')}</span>
            <div className="hero__trust-logos">
              <div className="hero__trust-logo">Noon</div>
              <div className="hero__trust-logo">Talabat</div>
              <div className="hero__trust-logo">Careem</div>
              <div className="hero__trust-logo">Fetchr</div>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="hero__visual">
          <div className="hero__dashboard">
            <div className="hero__dashboard-header">
              <div className="hero__dashboard-controls">
                <div className="hero__dashboard-control hero__dashboard-control--red"></div>
                <div className="hero__dashboard-control hero__dashboard-control--yellow"></div>
                <div className="hero__dashboard-control hero__dashboard-control--green"></div>
              </div>
              <div className="hero__dashboard-title">{t('hero.dashboardTitle')}</div>
            </div>

            <div className="hero__dashboard-content">
              <div className="hero__dashboard-nav">
                <div className="hero__dashboard-nav-item hero__dashboard-nav-item--active">
                  <div className="hero__dashboard-nav-icon">📊</div>
                  <span>{t('hero.analytics')}</span>
                </div>
                <div className="hero__dashboard-nav-item">
                  <div className="hero__dashboard-nav-icon">🔑</div>
                  <span>{t('hero.apiKeys')}</span>
                </div>
                <div className="hero__dashboard-nav-item">
                  <div className="hero__dashboard-nav-icon">📈</div>
                  <span>{t('hero.usage')}</span>
                </div>
              </div>

              <div className="hero__dashboard-main">
                <div className="hero__dashboard-stats">
                  <div className="hero__dashboard-stat">
                    <div className="hero__dashboard-stat-value">2.1M</div>
                    <div className="hero__dashboard-stat-label">{t('hero.apiCallsToday')}</div>
                    <div className="hero__dashboard-stat-trend">+12.5%</div>
                  </div>
                  <div className="hero__dashboard-stat">
                    <div className="hero__dashboard-stat-value">99.7%</div>
                    <div className="hero__dashboard-stat-label">{t('hero.accuracyRate')}</div>
                    <div className="hero__dashboard-stat-trend">+0.3%</div>
                  </div>
                  <div className="hero__dashboard-stat">
                    <div className="hero__dashboard-stat-value">1.2s</div>
                    <div className="hero__dashboard-stat-label">{t('hero.avgResponse')}</div>
                    <div className="hero__dashboard-stat-trend">-0.1s</div>
                  </div>
                </div>

                <div className="hero__dashboard-chart">
                  <div className="hero__dashboard-chart-header">
                    <h4>{t('hero.apiPerformance')}</h4>
                    <div className="hero__dashboard-chart-legend">
                      <div className="hero__dashboard-chart-legend-item">
                        <div className="hero__dashboard-chart-legend-color hero__dashboard-chart-legend-color--primary"></div>
                        <span>{t('hero.etaApi')}</span>
                      </div>
                      <div className="hero__dashboard-chart-legend-item">
                        <div className="hero__dashboard-chart-legend-color hero__dashboard-chart-legend-color--secondary"></div>
                        <span>{t('hero.distanceApi')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hero__dashboard-chart-bars">
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={i} className="hero__dashboard-chart-bar-group">
                        <div
                          className="hero__dashboard-chart-bar hero__dashboard-chart-bar--primary"
                          style={{ height: `${Math.random() * 60 + 20}%` }}
                        ></div>
                        <div
                          className="hero__dashboard-chart-bar hero__dashboard-chart-bar--secondary"
                          style={{ height: `${Math.random() * 50 + 15}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Cards */}
          <div className="hero__floating-cards">
            <div className="hero__floating-card hero__floating-card--1">
              <div className="hero__floating-card-icon">🚀</div>
              <div className="hero__floating-card-content">
                <div className="hero__floating-card-title">{t('hero.deployInSeconds')}</div>
                <div className="hero__floating-card-desc">{t('hero.getApiRunning')}</div>
              </div>
            </div>
            <div className="hero__floating-card hero__floating-card--2">
              <div className="hero__floating-card-icon">🌍</div>
              <div className="hero__floating-card-content">
                <div className="hero__floating-card-title">{t('hero.globalScale')}</div>
                <div className="hero__floating-card-desc">{t('hero.countriesSupported')}</div>
              </div>
            </div>
            <div className="hero__floating-card hero__floating-card--3">
              <div className="hero__floating-card-icon">⚡</div>
              <div className="hero__floating-card-content">
                <div className="hero__floating-card-title">{t('hero.lightningFast')}</div>
                <div className="hero__floating-card-desc">{t('hero.subSecondResponse')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hero__scroll">
        <div className="hero__scroll-text">{t('hero.discoverMore')}</div>
        <div className="hero__scroll-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M8 13L12 9M8 13L4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Hero;
