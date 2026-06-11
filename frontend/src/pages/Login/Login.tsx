import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearSessionExpired } from '../../store/slices/authSlice';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './Login.scss';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user, sessionExpired } = useAppSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showSessionExpiredToast, setShowSessionExpiredToast] = useState(false);

  useEffect(() => {
    if (sessionExpired) {
      setShowSessionExpiredToast(true);
      dispatch(clearSessionExpired());
      const timer = setTimeout(() => {
        setShowSessionExpiredToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired, dispatch]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'agency_admin' || user.role === 'gestionnaire_agency') {
        navigate('/agency');
      } else if (user.role === 'merchant') {
        navigate('/merchant/dashboard');
      } else if (user.role === 'user') {
        navigate('/client');
      } else if (user.role === 'developer') {
        navigate('/developer/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      setErrors({ general: error });
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = t('login.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('login.errors.emailInvalid');
    }
    if (!formData.password) {
      newErrors.password = t('login.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('login.errors.passwordMin');
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      await dispatch(login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      })).unwrap();
    } catch {
      // error is surfaced via Redux state (state.auth.error)
    }
  };

  return (
    <div className="login">
      {/* Session Expired Toast */}
      {showSessionExpiredToast && (
        <div className="login__toast">
          <div className="login__toast-content">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="login__toast-icon">
              <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6.66667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>{t('login.sessionExpired')}</span>
            <button className="login__toast-close" onClick={() => setShowSessionExpiredToast(false)} aria-label={t('common.close')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

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
          <span className="login__header-text">{t('login.noAccount')}</span>
          <Link to="/signup" className="login__header-link">
            {t('login.signUp')}
          </Link>
        </div>
      </header>

      <div className="login__container">
          <div className="login__card">
            <div className="login__form-container">
              <div className="login__card-header">
                <h1 className="login__title">{t('login.title')}</h1>
              </div>

              <form className="login__form" onSubmit={handleSubmit}>
                {errors.general && (
                  <div className="login__error">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1L1 15H15L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 12H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{errors.general}</span>
                  </div>
                )}

                <div className="login__field">
                  <label htmlFor="email" className="login__label">{t('login.emailLabel')}</label>
                  <div className="login__input-wrapper">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`login__input ${errors.email ? 'login__input--error' : ''}`}
                      placeholder={t('login.emailPlaceholder')}
                      autoComplete="email"
                    />
                    <div className="login__input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2.66667 4L8 7.33333L13.3333 4M2.66667 12.6667H13.3333C14.0697 12.6667 14.6667 12.0697 14.6667 11.3333V4.66667C14.6667 3.93029 14.0697 3.33333 13.3333 3.33333H2.66667C1.93029 3.33333 1.33333 3.93029 1.33333 4.66667V11.3333C1.33333 12.0697 1.93029 12.6667 2.66667 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {errors.email && <div className="login__field-error">{errors.email}</div>}
                </div>

                <div className="login__field">
                  <div className="login__label-row">
                    <label htmlFor="password" className="login__label">{t('login.passwordLabel')}</label>
                    <Link to="/forgot-password" className="login__forgot">{t('login.forgotPassword')}</Link>
                  </div>
                  <div className="login__input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`login__input ${errors.password ? 'login__input--error' : ''}`}
                      placeholder={t('login.passwordPlaceholder')}
                      autoComplete="current-password"
                    />
                    <div className="login__input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M11.3333 7.33333V5.33333C11.3333 3.86057 10.1394 2.66667 8.66667 2.66667C7.19391 2.66667 6 3.86057 6 5.33333V7.33333M5.33333 7.33333H10.6667C11.403 7.33333 12 7.93029 12 8.66667V12.6667C12 13.403 11.403 14 10.6667 14H5.33333C4.59695 14 4 13.403 4 12.6667V8.66667C4 7.93029 4.59695 7.33333 5.33333 7.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="login__password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
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
                  {errors.password && <div className="login__field-error">{errors.password}</div>}
                </div>

                <div className="login__options">
                  <label className="login__checkbox">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                    />
                    <span className="login__checkbox-mark"></span>
                    <span className="login__checkbox-text">{t('login.rememberMe')}</span>
                  </label>
                </div>

                <button type="submit" className="login__submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="login__spinner"></div>
                      <span>{t('login.submitting')}</span>
                    </>
                  ) : (
                    <span>{t('login.submit')}</span>
                  )}
                </button>
              </form>

              <div className="login__signup-link">
                <span>{t('login.noAccount')} </span>
                <Link to="/signup" className="login__signup">{t('login.signUp')}</Link>
              </div>

              <div className="login__footer">
                <p className="login__footer-text">
                  {t('login.legalText')}{' '}
                  <Link to="/terms" className="login__footer-link">{t('login.termsLink')}</Link>
                  {t('login.and')}{' '}
                  <Link to="/privacy" className="login__footer-link">{t('login.privacyLink')}</Link>
                  {t('login.legalCookies')}{' '}
                  <Link to="/cookies" className="login__footer-link">{t('login.cookiePrefs')}</Link>
                </p>
              </div>
            </div>
          </div>

          {/* Side Content */}
          <div className="login__side">
            <div className="login__side-content">
              <h2 className="login__side-title">
                {t('login.heroTitle')}
              </h2>
              <p className="login__side-subtitle">
                {t('login.heroSubtitle')}
              </p>

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
    </div>
  );
};

export default Login;
