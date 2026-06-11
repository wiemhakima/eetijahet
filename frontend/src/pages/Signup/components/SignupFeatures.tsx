import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Feature slides based on actual Etijahat APIs
const slides = [
  {
    id: 'eta',
    title: 'ETA Estimation',
    subtitle: 'Predict delivery times with precision',
    description: 'Calculate accurate estimated travel times between any two points in Kuwait with real-time traffic consideration.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.2" />
        <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2.5" />
        <path d="M32 16V32L42 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'distance',
    title: 'Distance Calculation',
    subtitle: 'Measure routes accurately',
    description: 'Get precise distance measurements between locations for route planning and delivery optimization.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M12 44L28 28L40 40L52 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="44" r="4" fill="currentColor" />
        <circle cx="52" cy="20" r="4" fill="currentColor" />
        <path d="M48 20H52V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'batch',
    title: 'Batch Processing',
    subtitle: 'Process multiple requests',
    description: 'Handle up to 100 addresses or coordinates in a single API call for efficient bulk operations.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none">
        <rect x="12" y="16" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
        <rect x="24" y="24" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
        <rect x="36" y="32" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'combined',
    title: 'Combined API',
    subtitle: 'All-in-one request',
    description: 'Get ETA, distance, and route data in a single optimized API call for maximum efficiency.',
    icon: (
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="28" r="6" stroke="currentColor" strokeWidth="2" />
        <circle cx="44" cy="28" r="6" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="44" r="6" stroke="currentColor" strokeWidth="2" />
        <path d="M24 32L28 38M40 32L36 38M28 42H36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  }
];

const SignupFeatures: React.FC = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsAnimating(false);
      }, 200);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    if (index !== currentSlide && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsAnimating(false);
      }, 200);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="signup-sidebar">
      {/* Background */}
      <div className="sidebar-bg">
        <div className="bg-gradient"></div>
        <div className="bg-pattern"></div>
        <div className="bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {/* Slide Content */}
        <div className="slide-container">
          <div className={`slide-content ${isAnimating ? 'fade-out' : 'fade-in'}`}>
            <div className="slide-icon">
              {slide.icon}
            </div>
            <h2 className="slide-title">{t(`signup.slide${currentSlide}Title`)}</h2>
            <p className="slide-subtitle">{t(`signup.slide${currentSlide}Subtitle`)}</p>
            <p className="slide-description">{t(`signup.slide${currentSlide}Desc`)}</p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          {/* Slide Dots */}
          <div className="slide-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="stat-number">7</span>
              <span className="stat-text">{t('signup.statEndpoints')}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">&lt;50ms</span>
              <span className="stat-text">{t('signup.statResponse')}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-text">{t('signup.statUptime')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupFeatures;
