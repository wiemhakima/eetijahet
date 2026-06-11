import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import './Register.scss';

type Plan = 'basic' | 'pro' | 'enterprise';

const PLANS: { id: Plan; label: string; price: string; desc: string }[] = [
  { id: 'basic',      label: 'Basic',      price: 'Gratuit',  desc: "Jusqu'à 5 marchands" },
  { id: 'pro',        label: 'Pro',        price: '29 KD/m',  desc: "Jusqu'à 50 marchands" },
  { id: 'enterprise', label: 'Enterprise', price: 'Sur devis', desc: 'Marchands illimités' },
];

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    agencyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [plan, setPlan] = useState<Plan>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Le prénom est requis';
    if (!form.agencyName.trim()) e.agencyName = "Le nom de l'agence est requis";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Adresse email invalide';
    if (form.password.length < 8)
      e.password = 'Le mot de passe doit contenir au moins 8 caractères';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Les mots de passe ne correspondent pas';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsLoading(true);
    try {
      const res = await api.post('/v1/agencies/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        agencyName: form.agencyName,
        email: form.email,
        password: form.password,
        plan,
      });
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      navigate('/agency');
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown; message?: string } } })
        ?.response?.data;
      const msg = raw?.error ?? raw?.message ?? 'Erreur lors de la création du compte';
      setErrors({ general: typeof msg === 'string' ? msg : String(msg) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register">
      <div className="register__container">

        {/* ── LEFT: Form panel ── */}
        <div className="register__left">
          <div className="register__form-wrap">

            <div className="register__logo">
              <span className="register__logo-icon">🚚</span>
              <span className="register__logo-text">Etijahat</span>
            </div>

            <h1 className="register__title">Créer votre agence</h1>
            <p className="register__subtitle">Commencez votre essai gratuit de 14 jours</p>

            <form className="register__form" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="register__error">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L1 15H15L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Prénom + Nom */}
              <div className="register__row">
                <div className="register__field">
                  <label htmlFor="firstName" className="register__label">Prénom *</label>
                  <div className="register__input-wrapper">
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className={`register__input${errors.firstName ? ' register__input--error' : ''}`}
                      placeholder="Mohammed"
                      autoComplete="given-name"
                    />
                    <div className="register__input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 14C2 11.7909 4.68629 10 8 10C11.3137 10 14 11.7909 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {errors.firstName && <div className="register__field-error">{errors.firstName}</div>}
                </div>

                <div className="register__field">
                  <label htmlFor="lastName" className="register__label">Nom</label>
                  <div className="register__input-wrapper">
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className="register__input"
                      placeholder="Al-Rashid"
                      autoComplete="family-name"
                    />
                    <div className="register__input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 14C2 11.7909 4.68629 10 8 10C11.3137 10 14 11.7909 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nom de l'agence */}
              <div className="register__field">
                <label htmlFor="agencyName" className="register__label">Nom de l'agence *</label>
                <div className="register__input-wrapper">
                  <input
                    type="text"
                    id="agencyName"
                    name="agencyName"
                    value={form.agencyName}
                    onChange={handleChange}
                    className={`register__input${errors.agencyName ? ' register__input--error' : ''}`}
                    placeholder="Kuwait Express Delivery"
                    autoComplete="organization"
                  />
                  <div className="register__input-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 14V6L8 2L14 6V14H10V10H6V14H2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                {errors.agencyName && <div className="register__field-error">{errors.agencyName}</div>}
              </div>

              {/* Email */}
              <div className="register__field">
                <label htmlFor="email" className="register__label">Email *</label>
                <div className="register__input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`register__input${errors.email ? ' register__input--error' : ''}`}
                    placeholder="contact@agence.kw"
                    autoComplete="email"
                  />
                  <div className="register__input-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2.66667 4L8 7.33333L13.3333 4M2.66667 12.6667H13.3333C14.0697 12.6667 14.6667 12.0697 14.6667 11.3333V4.66667C14.6667 3.93029 14.0697 3.33333 13.3333 3.33333H2.66667C1.93029 3.33333 1.33333 3.93029 1.33333 4.66667V11.3333C1.33333 12.0697 1.93029 12.6667 2.66667 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                {errors.email && <div className="register__field-error">{errors.email}</div>}
              </div>

              {/* Mot de passe */}
              <div className="register__field">
                <label htmlFor="password" className="register__label">Mot de passe *</label>
                <div className="register__input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className={`register__input${errors.password ? ' register__input--error' : ''}`}
                    placeholder="8 caractères minimum"
                    autoComplete="new-password"
                  />
                  <div className="register__input-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.3333 7.33333V5.33333C11.3333 3.86057 10.1394 2.66667 8.66667 2.66667C7.19391 2.66667 6 3.86057 6 5.33333V7.33333M5.33333 7.33333H10.6667C11.403 7.33333 12 7.93029 12 8.66667V12.6667C12 13.403 11.403 14 10.6667 14H5.33333C4.59695 14 4 13.403 4 12.6667V8.66667C4 7.93029 4.59695 7.33333 5.33333 7.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <button
                    type="button"
                    className="register__password-toggle"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
                {errors.password && <div className="register__field-error">{errors.password}</div>}
              </div>

              {/* Confirmer le mot de passe */}
              <div className="register__field">
                <label htmlFor="confirmPassword" className="register__label">Confirmer le mot de passe *</label>
                <div className="register__input-wrapper">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`register__input${errors.confirmPassword ? ' register__input--error' : ''}`}
                    placeholder="Répétez le mot de passe"
                    autoComplete="new-password"
                  />
                  <div className="register__input-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.3333 7.33333V5.33333C11.3333 3.86057 10.1394 2.66667 8.66667 2.66667C7.19391 2.66667 6 3.86057 6 5.33333V7.33333M5.33333 7.33333H10.6667C11.403 7.33333 12 7.93029 12 8.66667V12.6667C12 13.403 11.403 14 10.6667 14H5.33333C4.59695 14 4 13.403 4 12.6667V8.66667C4 7.93029 4.59695 7.33333 5.33333 7.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <button
                    type="button"
                    className="register__password-toggle"
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirm ? (
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
                {errors.confirmPassword && <div className="register__field-error">{errors.confirmPassword}</div>}
              </div>

              {/* Plan selection */}
              <div className="register__plans-wrap">
                <div className="register__plans-label">Choisissez votre plan</div>
                <div className="register__plans">
                  {PLANS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`register__plan-card${plan === p.id ? ' register__plan-card--active' : ''}`}
                      onClick={() => setPlan(p.id)}
                    >
                      <div className="register__plan-name">{p.label}</div>
                      <div className="register__plan-price">{p.price}</div>
                      <div className="register__plan-desc">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="register__submit" disabled={isLoading}>
                {isLoading ? (
                  <><div className="register__spinner" /><span>Création en cours…</span></>
                ) : (
                  <span>Créer mon compte</span>
                )}
              </button>
            </form>

            <div className="register__login-link">
              <span>Déjà un compte ?</span>
              <Link to="/login" className="register__login-cta"> → Se connecter</Link>
            </div>

          </div>
        </div>

        {/* ── RIGHT: Marketing panel ── */}
        <div className="register__right">
          <div className="register__right-content">
            <div className="register__right-logo">
              <span className="register__right-logo-icon">🚚</span>
              <span className="register__right-logo-text">Etijahat</span>
            </div>

            <div className="register__trial-badges">
              <span className="register__badge">✅ Essai gratuit 14 jours</span>
              <span className="register__badge">✅ Sans carte bancaire</span>
            </div>

            <h2 className="register__headline">
              Gérez vos livraisons<br />comme un pro 🚀
            </h2>

            <div className="register__features">
              <div className="register__feature-card">
                <span className="register__feature-emoji">🏪</span>
                <div>
                  <div className="register__feature-title">Multi-boutiques</div>
                  <div className="register__feature-desc">Gérez plusieurs marchands depuis un seul tableau de bord</div>
                </div>
              </div>
              <div className="register__feature-card">
                <span className="register__feature-emoji">📦</span>
                <div>
                  <div className="register__feature-title">Intégration Armada</div>
                  <div className="register__feature-desc">Suivi en temps réel de chaque livraison via l'API Armada</div>
                </div>
              </div>
              <div className="register__feature-card">
                <span className="register__feature-emoji">📊</span>
                <div>
                  <div className="register__feature-title">Analytics temps réel</div>
                  <div className="register__feature-desc">Statistiques détaillées, commissions et revenus en un clic</div>
                </div>
              </div>
            </div>

            <div className="register__stats-bar">
              <div className="register__stat-item">
                <div className="register__stat-number">500+</div>
                <div className="register__stat-label">Boutiques</div>
              </div>
              <div className="register__stat-item">
                <div className="register__stat-number">99.9%</div>
                <div className="register__stat-label">Uptime</div>
              </div>
              <div className="register__stat-item">
                <div className="register__stat-number">&lt;1s</div>
                <div className="register__stat-label">Réponse</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
