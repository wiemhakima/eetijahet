import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import './Header.scss';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="header__background" />
      <div className="header__container">
        <div className="header__content">
          {/* Logo */}
          <div className="header__logo">
            <div className="header__logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="header__logo-text">
              <span className="header__brand-name">Etijahat</span>
              <div className="header__status">
                <div className="header__status-dot"></div>
                <span className="header__status-text">{t('header.allSystemsOperational')}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="header__nav">
            <ul className="header__nav-list">
              <li className="header__nav-item">
                <Link to="/products" className="header__nav-link">
                  <span>{t('nav.products')}</span>
                </Link>
              </li>
              <li className="header__nav-item">
                <Link to="/pricing" className="header__nav-link">
                  <span>{t('nav.pricing')}</span>
                </Link>
              </li>
              <li className="header__nav-item">
                <Link to="/docs" className="header__nav-link">
                  <span>{t('nav.docs')}</span>
                </Link>
              </li>
              <li className="header__nav-item">
                <Link to="/support" className="header__nav-link">
                  <span>{t('nav.support')}</span>
                </Link>
              </li>
              <li className="header__nav-item">
                <Link to="/blog" className="header__nav-link">
                  <span>{t('nav.blog')}</span>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Actions */}
          <div className="header__actions">
            <LanguageSwitcher />
            <Link to="/login" className="header__auth-link header__auth-link--login">
              {t('nav.login')}
            </Link>
            <Link to="/signup" className="header__auth-link header__auth-link--signup">
              {t('nav.signup')}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`header__mobile-btn ${isMobileMenuOpen ? 'header__mobile-btn--active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={t('header.mobileMenuToggle')}
          >
            <span className="header__mobile-line"></span>
            <span className="header__mobile-line"></span>
            <span className="header__mobile-line"></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`header__mobile-menu ${isMobileMenuOpen ? 'header__mobile-menu--open' : ''}`}>
          <div className="header__mobile-content">
            <nav className="header__mobile-nav">
              <Link to="/products" className="header__mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span>{t('nav.products')}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/pricing" className="header__mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span>{t('nav.pricing')}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/docs" className="header__mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span>{t('nav.docs')}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/support" className="header__mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span>{t('nav.support')}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/blog" className="header__mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span>{t('nav.blog')}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </nav>
            <div className="header__mobile-actions">
                <Link to="/login" className="header__mobile-auth" onClick={() => setIsMobileMenuOpen(false)}>
                {t('nav.login')}
              </Link>
              <Link to="/signup" className="header__mobile-auth header__mobile-auth--primary" onClick={() => setIsMobileMenuOpen(false)}>
                {t('nav.signup')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="header__overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
