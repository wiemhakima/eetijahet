import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import '../Login/Login.scss';
import './ResetPassword.scss';

const strengthLabels = ['', 'weak', 'fair', 'good', 'strong'] as const;

function getStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (pwd.length < 8) return 0;
  let score = 1;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(4, score) as 1 | 2 | 3 | 4;
}

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError(t('login.errors.passwordMin')); return; }
    if (password !== confirm) { setError(t('resetPassword.passwordMismatch')); return; }

    setIsLoading(true);
    try {
      await api.post('/v1/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t('resetPassword.errorInvalidToken'));
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
        <div className="login__container">
          <div className="login__card">
            <div className="login__form-container">
              {done ? (
                <div className="auth-success">
                  <div className="auth-icon-circle">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <path d="M20 4L9 15L4 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="login__title" style={{ textAlign: 'center' }}>{t('resetPassword.title')}</h2>
                  <p style={{ color: '#6b7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 8 }}>
                    {t('resetPassword.successMessage')}
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                    {t('resetPassword.redirecting')}
                  </p>
                  <div className="countdown-bar">
                    <div className="countdown-bar__fill"></div>
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <Link to="/login" className="login__submit" style={{ textDecoration: 'none' }}>
                      {t('forgotPassword.backToLogin')}
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="login__card-header">
                    <h1 className="login__title">{t('resetPassword.title')}</h1>
                    <p style={{ color: '#6b7280', fontSize: 14, marginTop: -16, marginBottom: 8 }}>
                      {t('resetPassword.subtitle')}
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
                      <label htmlFor="password" className="login__label">{t('resetPassword.newPassword')}</label>
                      <div className="login__input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="login__input"
                          placeholder={t('login.passwordPlaceholder')}
                          autoFocus
                        />
                        <div className="login__input-icon">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.3333 7.33333V5.33333C11.3333 3.86057 10.1394 2.66667 8.66667 2.66667C7.19391 2.66667 6 3.86057 6 5.33333V7.33333M5.33333 7.33333H10.6667C11.403 7.33333 12 7.93029 12 8.66667V12.6667C12 13.403 11.403 14 10.6667 14H5.33333C4.59695 14 4 13.403 4 12.6667V8.66667C4 7.93029 4.59695 7.33333 5.33333 7.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <button
                          type="button"
                          className="login__password-toggle"
                          onClick={() => setShowPassword(v => !v)}
                          aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                        >
                          {showPassword ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M9.41421 9.41421C9.03914 9.78929 8.53043 10 8 10C6.89543 10 6 9.10457 6 8C6 7.46957 6.21071 6.96086 6.58579 6.58579M9.41421 9.41421L6.58579 6.58579M9.41421 9.41421L11 11M6.58579 6.58579L5 5M8 3C10.7614 3 13 5.23858 13 8C13 8.35064 12.9649 8.69194 12.8998 9.02061M3 8C3 8.64936 3.06509 9.30806 3.1002 9.97939C3.35064 10.6506 4.64936 13 8 13C8.35064 13 8.69194 12.9351 9.02061 12.8002" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M1 1L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 3C4.64936 3 3.35064 5.34936 3.1002 6.02061C3.06509 6.30806 3 6.64936 3 8C3 9.35064 3.06509 9.69194 3.1002 9.97939C3.35064 10.6506 4.64936 13 8 13C11.3506 13 12.6494 10.6506 12.8998 9.97939C12.9351 9.69194 13 9.35064 13 8C13 6.64936 12.9351 6.30806 12.8998 6.02061C12.6494 5.34936 11.3506 3 8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      {password.length > 0 && (
                        <>
                          <div className="strength-bars">
                            {[1, 2, 3, 4].map(i => (
                              <div
                                key={i}
                                className={`strength-bar${strength >= i ? ` strength-bar--${strength}` : ''}`}
                              />
                            ))}
                          </div>
                          {strength > 0 && (
                            <div className={`strength-label strength-label--${strength}`}>
                              {t(`resetPassword.strength.${strengthLabels[strength]}`)}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="login__field">
                      <label htmlFor="confirm" className="login__label">{t('resetPassword.confirmPassword')}</label>
                      <div className="login__input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="confirm"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          className="login__input"
                          placeholder={t('resetPassword.confirmPlaceholder')}
                        />
                        <div className="login__input-icon">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M11.3333 7.33333V5.33333C11.3333 3.86057 10.1394 2.66667 8.66667 2.66667C7.19391 2.66667 6 3.86057 6 5.33333V7.33333M5.33333 7.33333H10.6667C11.403 7.33333 12 7.93029 12 8.66667V12.6667C12 13.403 11.403 14 10.6667 14H5.33333C4.59695 14 4 13.403 4 12.6667V8.66667C4 7.93029 4.59695 7.33333 5.33333 7.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="login__submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="login__spinner"></div>
                          <span>{t('resetPassword.saving')}</span>
                        </>
                      ) : (
                        <span>{t('resetPassword.save')}</span>
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

          <div className="login__side">
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

              <div className="login__stats" style={{ background: 'rgba(0,0,0,0.15)', border: 'none', backdropFilter: 'none' }}>
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

export default ResetPassword;
