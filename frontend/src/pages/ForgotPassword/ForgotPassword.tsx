import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import '../Login/Login.scss';
import './ForgotPassword.scss';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError(t('login.errors.emailRequired')); return; }
    setIsLoading(true);
    setError('');
    try {
      await api.post('/v1/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError(t('forgotPassword.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login__background">
        <div className="login__background-gradient"></div>
        <div className="login__background-pattern"></div>
      </div>

      <header className="login__header">
        <Link to="/" className="login__logo">
          <div className="login__logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="login__logo-text">Etijahat</span>
        </Link>

        <div className="login__header-actions">
          <LanguageSwitcher />
          <Link to="/login" className="login__header-link">
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </header>

      <main className="login__main">
        <div className="fp-cols">
          <div className="fp-left">
            <div className="login__form-container">
              {sent ? (
                <div className="auth-success">
                  <div className="auth-icon-circle">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <path d="M20 4L9 15L4 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="login__title" style={{ textAlign: 'center' }}>{t('forgotPassword.title')}</h2>
                  <p style={{ color: '#6b7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
                    {t('forgotPassword.sentMessage')}
                  </p>
                  <Link to="/login" className="login__submit" style={{ textDecoration: 'none' }}>
                    {t('forgotPassword.backToLogin')}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="login__card-header">
                    <h1 className="login__title">{t('forgotPassword.title')}</h1>
                    <p style={{ color: '#6b7280', fontSize: 14, marginTop: -16, marginBottom: 8 }}>
                      {t('forgotPassword.subtitle')}
                    </p>
                  </div>

                  <form className="login__form" onSubmit={handleSubmit}>
                    {error && (
                      <div className="login__error">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 1L1 15H15L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 12H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="login__field">
                      <label htmlFor="email" className="login__label">{t('login.emailLabel')}</label>
                      <div className="login__input-wrapper">
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="login__input"
                          placeholder={t('login.emailPlaceholder')}
                          autoComplete="email"
                          autoFocus
                        />
                        <div className="login__input-icon">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2.66667 4L8 7.33333L13.3333 4M2.66667 12.6667H13.3333C14.0697 12.6667 14.6667 12.0697 14.6667 11.3333V4.66667C14.6667 3.93029 14.0697 3.33333 13.3333 3.33333H2.66667C1.93029 3.33333 1.33333 3.93029 1.33333 4.66667V11.3333C1.33333 12.0697 1.93029 12.6667 2.66667 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="login__submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="login__spinner"></div>
                          <span>{t('forgotPassword.sending')}</span>
                        </>
                      ) : (
                        <span>{t('forgotPassword.sendLink')}</span>
                      )}
                    </button>
                  </form>

                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link to="/login" className="login__forgot">
                      ← {t('forgotPassword.backToLogin')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="fp-right login__side">
            <div className="login__side-content">
              <h2 className="login__side-title">{t('login.heroTitle')}</h2>
              <p className="login__side-subtitle">{t('login.heroSubtitle')}</p>

              <div className="login__features">
                <div className="login__feature">
                  <div className="login__feature-icon">
                    <span style={{ fontSize: 28 }}>🏪</span>
                  </div>
                  <div className="login__feature-content">
                    <h3>{t('login.feature1Title')}</h3>
                    <p>{t('login.feature1Desc')}</p>
                  </div>
                </div>
                <div className="login__feature">
                  <div className="login__feature-icon">
                    <span style={{ fontSize: 28 }}>📦</span>
                  </div>
                  <div className="login__feature-content">
                    <h3>{t('login.feature2Title')}</h3>
                    <p>{t('login.feature2Desc')}</p>
                  </div>
                </div>
                <div className="login__feature">
                  <div className="login__feature-icon">
                    <span style={{ fontSize: 28 }}>📊</span>
                  </div>
                  <div className="login__feature-content">
                    <h3>{t('login.feature3Title')}</h3>
                    <p>{t('login.feature3Desc')}</p>
                  </div>
                </div>
              </div>

              <div className="login__stats" style={{
                background: 'rgba(0,0,0,0.15)',
                borderRadius: 12,
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-around',
                marginTop: 32,
                border: 'none',
                backdropFilter: 'none',
              }}>
                <div className="login__stat" style={{ textAlign: 'center' }}>
                  <div className="login__stat-value" style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>500+</div>
                  <div className="login__stat-label" style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{t('login.stat3Label')}</div>
                </div>
                <div className="login__stat" style={{ textAlign: 'center' }}>
                  <div className="login__stat-value" style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>99.9%</div>
                  <div className="login__stat-label" style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{t('login.stat2Label')}</div>
                </div>
                <div className="login__stat" style={{ textAlign: 'center' }}>
                  <div className="login__stat-value" style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>&lt;1s</div>
                  <div className="login__stat-label" style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{t('login.stat1Label')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
