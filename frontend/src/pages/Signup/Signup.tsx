import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signup, registerAgency } from '../../store/slices/authSlice';
import ReCAPTCHA from 'react-google-recaptcha';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import {
  LogoIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SpinnerIcon,
  SignupFeatures,
} from './components';
import './Signup.scss';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

const PLAN_DISPLAY: Record<string, { label: string; price: string }> = {
  basic:      { label: 'Basic',      price: '15 KWD/mo' },
  pro:        { label: 'Pro',        price: '45 KWD/mo' },
  enterprise: { label: 'Enterprise', price: '150 KWD/mo' },
};

const Signup: React.FC = () => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    company: '',
    serviceCountry: 'Kuwait',
    agreeTerms: false,
    role: '',
    plan: 'basic',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;
    setPasswordStrength(Math.min(100, strength));
  }, [formData.password]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 25) return { label: t('signup.passwordStrength.weak'),  color: '#ef4444' };
    if (passwordStrength < 50) return { label: t('signup.passwordStrength.fair'),  color: '#f59e0b' };
    if (passwordStrength < 75) return { label: t('signup.passwordStrength.good'),  color: '#3b82f6' };
    return                           { label: t('signup.passwordStrength.strong'), color: '#10b981' };
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
    if (errors.recaptcha) setErrors({ ...errors, recaptcha: '' });
  };

  const handleRecaptchaExpired = () => setRecaptchaToken(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim())
        newErrors.fullName = t('signup.errors.fullNameRequired');
      if (!formData.email.trim())
        newErrors.email = t('signup.errors.emailRequired');
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = t('signup.errors.emailInvalid');
      if (!formData.password)
        newErrors.password = t('signup.errors.passwordRequired');
      else if (formData.password.length < 8)
        newErrors.password = t('signup.errors.passwordMin');
    }

    if (step === 2) {
      if (!formData.role)
        newErrors.role = t('signup.errors.roleRequired');
      if (formData.role === 'agency' && !formData.company.trim())
        newErrors.company = t('signup.errors.companyRequired');
    }

    if (step === 3) {
      if (!recaptchaToken)
        newErrors.recaptcha = t('signup.errors.recaptchaRequired');
      if (!formData.agreeTerms)
        newErrors.agreeTerms = t('signup.errors.termsRequired');
    }

    return newErrors;
  };

  const handleNextStep = () => {
    const newErrors = validateStep(currentStep);
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => setCurrentStep(currentStep - 1);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user } = useAppSelector(state => state.auth);

  useEffect(() => { setIsSubmitting(isLoading); }, [isLoading]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'agency_admin') navigate('/agency');
      else if (user.role === 'user') navigate('/client');
      else if (user.role === 'developer') navigate('/developer/dashboard');
      else navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) setErrors(prev => ({ ...prev, general: error }));
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < 3) { handleNextStep(); return; }

    const newErrors = validateStep(3);
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true);

    try {
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      if (formData.role === 'agency') {
        await dispatch(registerAgency({
          agencyName: formData.company,
          firstName, lastName,
          email: formData.email,
          password: formData.password,
          plan: formData.plan,
          recaptchaToken,
        })).unwrap();
        navigate('/agency');
      } else {
        await dispatch(signup({
          firstName, lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.password,
          company: formData.company,
          recaptchaToken,
          agreeMarketing: false,
          role: formData.role === 'client' ? 'user' : formData.role,
        })).unwrap();
        navigate(formData.role === 'client' ? '/client' : '/developer/dashboard');
      }
    } catch (err) {
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setRecaptchaToken(null);
      const errMsg = Array.isArray(err)
        ? err.join(', ')
        : typeof err === 'string'
        ? err
        : t('signup.errors.signupFailed');
      setErrors(prev => ({ ...prev, general: errMsg }));
      setIsSubmitting(false);
    }
  };

  const totalSteps = 3;

  // Role definitions — labels/descs come from i18n
  const roles = [
    { value: 'agency',    emoji: '🏢', label: t('signup.roles.agency.label'),    desc: t('signup.roles.agency.desc') },
    { value: 'developer', emoji: '💻', label: t('signup.roles.developer.label'), desc: t('signup.roles.developer.desc') },
  ];

  // Plan definitions — prices stay hardcoded, descriptions are translated
  const plans = [
    { value: 'basic',      label: 'Basic',      price: '15 KWD/mo',  desc: t('signup.plans.basic.desc') },
    { value: 'pro',        label: 'Pro',        price: '45 KWD/mo',  desc: t('signup.plans.pro.desc') },
    { value: 'enterprise', label: 'Enterprise', price: '150 KWD/mo', desc: t('signup.plans.enterprise.desc') },
  ];

  return (
    <div className="signup-page">
      {/* Full-width Header Bar */}
      <header className="signup-page-header">
        <Link to="/" className="signup-page-header__logo">
          <LogoIcon />
          <span>{t('signup.brand')}</span>
        </Link>

        <div className="signup-page-header__actions">
          <LanguageSwitcher />
          <span className="signup-page-header__text">{t('signup.alreadyAccount')}</span>
          <Link to="/login" className="signup-page-header__link">
            {t('signup.loginLink')}
          </Link>
        </div>
      </header>

      {/* Left Panel - Form */}
      <div className="signup-form-panel">
        <div className="signup-form-wrapper">
          <div className="signup-form-content">

            {/* Progress Indicator */}
            <div className="progress-indicator">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                >
                  <div className="step-circle">
                    {currentStep > step ? <CheckIcon /> : step}
                  </div>
                  <span className="step-label">
                    {step === 1 && t('signup.steps.account')}
                    {step === 2 && t('signup.steps.company')}
                    {step === 3 && t('signup.steps.verify')}
                  </span>
                </div>
              ))}
              <div className="progress-line">
                <div
                  className="progress-fill"
                  style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Form Header */}
            <div className="form-header">
              <h1>
                {currentStep === 1 && t('signup.step1.title')}
                {currentStep === 2 && t('signup.step2.title')}
                {currentStep === 3 && t('signup.step3.title')}
              </h1>
              <p>
                {currentStep === 1 && t('signup.step1.subtitle')}
                {currentStep === 2 && t('signup.step2.subtitle')}
                {currentStep === 3 && t('signup.step3.subtitle')}
              </p>
            </div>

            {/* Form */}
            <form className="signup-form" onSubmit={handleSubmit}>
              {/* General Error */}
              {errors.general && (
                <div className="alert alert-error">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                    <path d="M10 6v5M10 13v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>{errors.general}</span>
                </div>
              )}

              {/* ── Step 1: Account Info ── */}
              {currentStep === 1 && (
                <div className="form-step">
                  <div className="form-group">
                    <label htmlFor="fullName">{t('signup.fullName')}</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={errors.fullName ? 'error' : ''}
                      placeholder={t('signup.fullNamePlaceholder')}
                      autoComplete="name"
                      autoFocus
                    />
                    {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">{t('signup.emailLabel')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'error' : ''}
                      placeholder={t('signup.emailPlaceholder')}
                      autoComplete="email"
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">{t('signup.passwordLabel')}</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? 'error' : ''}
                        placeholder={t('signup.passwordPlaceholder')}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="password-strength">
                        <div className="strength-bar">
                          <div
                            className="strength-fill"
                            style={{
                              width: `${passwordStrength}%`,
                              backgroundColor: getPasswordStrengthLabel().color,
                            }}
                          />
                        </div>
                        <span className="strength-label" style={{ color: getPasswordStrengthLabel().color }}>
                          {getPasswordStrengthLabel().label}
                        </span>
                      </div>
                    )}
                    {errors.password && <span className="error-text">{errors.password}</span>}
                  </div>
                </div>
              )}

              {/* ── Step 2: Role + Company Info ── */}
              {currentStep === 2 && (
                <div className="form-step">
                  {/* Role Selector */}
                  <div className="form-group">
                    <label>{t('signup.iAmA')}</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {roles.map(r => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, role: r.value }))}
                          style={{
                            flex: 1,
                            padding: '18px 12px',
                            borderRadius: '12px',
                            border: `2px solid ${formData.role === r.value ? '#1a73e8' : 'rgba(0,0,0,0.12)'}`,
                            background: formData.role === r.value ? 'rgba(26,115,232,0.08)' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.18s',
                            outline: 'none',
                          }}
                        >
                          <div style={{ fontSize: '28px', marginBottom: '8px' }}>{r.emoji}</div>
                          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{r.label}</div>
                          <div style={{ fontSize: '11px', opacity: 0.55, lineHeight: 1.3 }}>{r.desc}</div>
                        </button>
                      ))}
                    </div>
                    {errors.role && <span className="error-text">{errors.role}</span>}
                  </div>

                  {/* Company Name — only for agency */}
                  {formData.role === 'agency' && (
                    <div className="form-group">
                      <label htmlFor="company">{t('signup.companyLabel')}</label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className={errors.company ? 'error' : ''}
                        placeholder={t('signup.companyPlaceholder')}
                        autoComplete="organization"
                      />
                      {errors.company && <span className="error-text">{errors.company}</span>}
                    </div>
                  )}

                  {/* Plan selector — only for agency */}
                  {formData.role === 'agency' && (
                    <div className="form-group">
                      <label>{t('signup.choosePlan')}</label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {plans.map(p => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, plan: p.value }))}
                            style={{
                              flex: 1,
                              padding: '12px 6px',
                              borderRadius: '12px',
                              border: `2px solid ${formData.plan === p.value ? '#1a73e8' : 'rgba(0,0,0,0.12)'}`,
                              background: formData.plan === p.value ? 'rgba(26,115,232,0.08)' : 'transparent',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.18s',
                              outline: 'none',
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '2px' }}>{p.label}</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a73e8', marginBottom: '3px' }}>{p.price}</div>
                            <div style={{ fontSize: '10px', opacity: 0.5, lineHeight: 1.3 }}>{p.desc}</div>
                          </button>
                        ))}
                      </div>
                      <p style={{ fontSize: '11px', opacity: 0.55, marginTop: '6px', margin: '6px 0 0' }}>
                        {t('signup.planTrialNote')}
                      </p>
                    </div>
                  )}

                  {/* Service Region */}
                  <div className="form-group">
                    <label>{t('signup.serviceRegion')}</label>
                    <div className="country-selector">
                      <div className="country-option selected">
                        <div className="country-info">
                          <span style={{ fontSize: '22px', lineHeight: 1 }}>🇰🇼</span>
                          <span className="country-name">{t('signup.kuwait')}</span>
                        </div>
                        <div className="check-icon">
                          <CheckIcon />
                        </div>
                      </div>
                      <p className="country-note">{t('signup.moreRegionsSoon')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Summary + reCAPTCHA & Terms ── */}
              {currentStep === 3 && (
                <div className="form-step">

                  {/* Agency summary */}
                  {formData.role === 'agency' && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.07)',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '14px',
                      padding: '16px 18px',
                      marginBottom: '20px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '26px', lineHeight: 1 }}>🏢</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>{t('signup.agencySummary.title')}</div>
                          <div style={{ fontSize: '12px', opacity: 0.65, marginTop: '2px' }}>
                            {t('signup.agencySummary.subtitle')}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '14px', lineHeight: 1.5 }}>
                        {t('signup.agencySummary.note')}
                      </div>

                      {/* Selected plan row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.85)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        border: '1px solid rgba(16,185,129,0.2)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px' }}>
                            {PLAN_DISPLAY[formData.plan]?.label ?? formData.plan}
                          </span>
                          <span style={{ color: '#10b981', fontWeight: 700, fontSize: '14px' }}>
                            {PLAN_DISPLAY[formData.plan]?.price}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          style={{
                            fontSize: '12px',
                            color: '#10b981',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          {t('signup.agencySummary.change')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Developer summary */}
                  {formData.role === 'developer' && (
                    <div style={{
                      background: 'rgba(26, 115, 232, 0.06)',
                      border: '2px solid rgba(26, 115, 232, 0.2)',
                      borderRadius: '14px',
                      padding: '16px 18px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}>
                      <span style={{ fontSize: '26px', lineHeight: 1 }}>💻</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{t('signup.developerSummary.title')}</div>
                        <div style={{ fontSize: '12px', opacity: 0.65, marginTop: '3px', lineHeight: 1.5 }}>
                          {t('signup.developerSummary.desc')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* reCAPTCHA */}
                  <div className="form-group recaptcha-group">
                    <label>{t('signup.verifyHuman')}</label>
                    <div className="recaptcha-wrapper">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={handleRecaptchaChange}
                        onExpired={handleRecaptchaExpired}
                        theme="light"
                      />
                    </div>
                    {errors.recaptcha && <span className="error-text">{errors.recaptcha}</span>}
                  </div>

                  {/* Terms */}
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                      />
                      <span className="checkbox-custom">
                        <CheckIcon />
                      </span>
                      <span className="checkbox-text">
                        {t('signup.agreeTerms')}{' '}
                        <Link to="/terms">{t('signup.termsLink')}</Link>{' '}
                        {t('signup.andText')}{' '}
                        <Link to="/privacy">{t('signup.privacyLink')}</Link>
                      </span>
                    </label>
                    {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                {currentStep > 1 && (
                  <button type="button" className="btn btn-back" onClick={handlePrevStep}>
                    <ArrowLeftIcon />
                    <span>{t('common.back')}</span>
                  </button>
                )}

                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <SpinnerIcon />
                      <span>{t('signup.creating')}</span>
                    </>
                  ) : (
                    <>
                      <span>{currentStep < 3 ? t('common.continue') : t('signup.createAccount')}</span>
                      {currentStep < 3 && <ArrowRightIcon />}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sign In Link */}
            <div className="signin-link">
              {t('signup.alreadyHaveAccount')}{' '}
              <Link to="/login">{t('signup.signInLink')}</Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="signup-footer">
          <p>{t('signup.footerCopyright')}</p>
          <div className="footer-links">
            <Link to="/terms">{t('signup.footerTerms')}</Link>
            <Link to="/privacy">{t('signup.footerPrivacy')}</Link>
            <Link to="/documentation">{t('signup.footerDocs')}</Link>
          </div>
        </footer>
      </div>

      {/* Right Panel - Features */}
      <SignupFeatures />
    </div>
  );
};

export default Signup;
