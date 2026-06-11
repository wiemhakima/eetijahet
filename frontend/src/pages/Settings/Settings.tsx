import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfile, changePassword, clearError } from '../../store/slices/authSlice';
import Avatar from '../../components/Avatar';
import './Settings.scss';

// Icons
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

type SettingsTab = 'profile' | 'security' | 'notifications' | 'account';

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { user, isLoading, error } = useAppSelector(state => state.auth);

  const isSuperAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // If a superadmin somehow lands on the hidden Security tab, redirect to Profile
  useEffect(() => {
    if (isSuperAdmin && activeTab === 'security') setActiveTab('profile');
  }, [isSuperAdmin, activeTab]);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [company, setCompany] = useState(user?.company || '');
  const [agreeMarketing, setAgreeMarketing] = useState(user?.agreeMarketing || false);
  const [profileSuccess, setProfileSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setCompany(user.company || '');
      setAgreeMarketing(user.agreeMarketing);
    }
  }, [user]);

  useEffect(() => {
    setProfileSuccess('');
    setPasswordSuccess('');
    setPasswordError('');
    dispatch(clearError());
  }, [activeTab, dispatch]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    dispatch(clearError());
    try {
      await dispatch(updateProfile({ firstName, lastName, company, agreeMarketing })).unwrap();
      setProfileSuccess(t('settings.profile.successMsg'));
    } catch {
      // Error handled by the slice
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    dispatch(clearError());

    if (newPassword.length < 8) {
      setPasswordError(t('settings.security.errors.passwordMin'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.security.errors.passwordMismatch'));
      return;
    }
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      setPasswordSuccess(t('settings.security.successMsg'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // Error handled by the slice
    }
  };

  const allTabs: { id: SettingsTab; labelKey: string; icon: React.FC }[] = [
    { id: 'profile',       labelKey: 'settings.tabs.profile',       icon: UserIcon },
    { id: 'security',      labelKey: 'settings.tabs.security',      icon: LockIcon },
    { id: 'notifications', labelKey: 'settings.tabs.notifications', icon: BellIcon },
    { id: 'account',       labelKey: 'settings.tabs.account',       icon: InfoIcon },
  ];

  // Superadmin does not use Change Password or Sessions — hide the Security tab
  const tabs = isSuperAdmin ? allTabs.filter(t => t.id !== 'security') : allTabs;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-header__title">{t('settings.title')}</h1>
        <p className="settings-header__desc">{t('settings.subtitle')}</p>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-nav__item ${activeTab === tab.id ? 'settings-nav__item--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon />
                <span>{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="settings-content">
          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <div className="settings-card">
                <div className="settings-card__header">
                  <h2>{t('settings.profile.title')}</h2>
                  <p>{t('settings.profile.subtitle')}</p>
                </div>
                <form className="settings-card__body" onSubmit={handleProfileSubmit}>
                  <div className="settings-avatar-row">
                    <Avatar firstName={user?.firstName} lastName={user?.lastName} size="large" />
                    <div className="settings-avatar-info">
                      <span className="settings-avatar-info__name">{user?.firstName} {user?.lastName}</span>
                      <span className="settings-avatar-info__email">{user?.email}</span>
                    </div>
                  </div>

                  <div className="settings-form-grid">
                    <div className="settings-field">
                      <label htmlFor="firstName">{t('settings.profile.firstName')}</label>
                      <input id="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    </div>
                    <div className="settings-field">
                      <label htmlFor="lastName">{t('settings.profile.lastName')}</label>
                      <input id="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="settings-field">
                    <label htmlFor="email">{t('settings.profile.email')}</label>
                    <input id="email" type="email" value={user?.email || ''} disabled className="settings-field__disabled" />
                    <span className="settings-field__hint">{t('settings.profile.emailHint')}</span>
                  </div>

                  <div className="settings-field">
                    <label htmlFor="company">{t('settings.profile.company')}</label>
                    <input id="company" type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder={t('settings.profile.companyPlaceholder')} />
                  </div>

                  <div className="settings-checkbox">
                    <input id="marketing" type="checkbox" checked={agreeMarketing} onChange={e => setAgreeMarketing(e.target.checked)} />
                    <label htmlFor="marketing">{t('settings.profile.marketing')}</label>
                  </div>

                  {profileSuccess && (
                    <div className="settings-alert settings-alert--success">
                      <CheckIcon />
                      {profileSuccess}
                    </div>
                  )}
                  {error && activeTab === 'profile' && (
                    <div className="settings-alert settings-alert--error">{error}</div>
                  )}

                  <div className="settings-card__footer">
                    <button type="submit" className="settings-btn settings-btn--primary" disabled={isLoading}>
                      {isLoading ? t('settings.profile.saving') : t('settings.profile.saveBtn')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security tab */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <div className="settings-card">
                <div className="settings-card__header">
                  <h2>{t('settings.security.passwordTitle')}</h2>
                  <p>{t('settings.security.passwordSubtitle')}</p>
                </div>
                <form className="settings-card__body" onSubmit={handlePasswordSubmit}>
                  <div className="settings-field">
                    <label htmlFor="currentPassword">{t('settings.security.currentPassword')}</label>
                    <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder={t('settings.security.currentPasswordPlaceholder')} />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="newPassword">{t('settings.security.newPassword')}</label>
                    <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} placeholder={t('settings.security.newPasswordPlaceholder')} />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="confirmPassword">{t('settings.security.confirmPassword')}</label>
                    <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder={t('settings.security.confirmPasswordPlaceholder')} />
                  </div>

                  {passwordSuccess && (
                    <div className="settings-alert settings-alert--success">
                      <CheckIcon />
                      {passwordSuccess}
                    </div>
                  )}
                  {(passwordError || (error && activeTab === 'security')) && (
                    <div className="settings-alert settings-alert--error">{passwordError || error}</div>
                  )}

                  <div className="settings-card__footer">
                    <button type="submit" className="settings-btn settings-btn--primary" disabled={isLoading}>
                      {isLoading ? t('settings.security.updating') : t('settings.security.updateBtn')}
                    </button>
                  </div>
                </form>
              </div>

              <div className="settings-card">
                <div className="settings-card__header">
                  <h2>{t('settings.security.sessionsTitle')}</h2>
                  <p>{t('settings.security.sessionsSubtitle')}</p>
                </div>
                <div className="settings-card__body">
                  <div className="settings-session">
                    <div className="settings-session__info">
                      <span className="settings-session__label">{t('settings.security.currentSession')}</span>
                      <span className="settings-session__detail">{t('settings.security.currentSessionDetail')}</span>
                    </div>
                    <span className="settings-session__badge">{t('settings.security.currentBadge')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications tab */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="settings-card">
                <div className="settings-card__header">
                  <h2>{t('settings.notifPrefs.title')}</h2>
                  <p>{t('settings.notifPrefs.subtitle')}</p>
                </div>
                <div className="settings-card__body">
                  <div className="settings-toggle-list">
                    <div className="settings-toggle-item">
                      <div>
                        <span className="settings-toggle-item__label">{t('settings.notifPrefs.apiAlerts')}</span>
                        <span className="settings-toggle-item__desc">{t('settings.notifPrefs.apiAlertsDesc')}</span>
                      </div>
                      <label className="settings-toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="settings-toggle__slider" />
                      </label>
                    </div>

                    <div className="settings-toggle-item">
                      <div>
                        <span className="settings-toggle-item__label">{t('settings.notifPrefs.billingNotifs')}</span>
                        <span className="settings-toggle-item__desc">{t('settings.notifPrefs.billingNotifsDesc')}</span>
                      </div>
                      <label className="settings-toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="settings-toggle__slider" />
                      </label>
                    </div>

                    <div className="settings-toggle-item">
                      <div>
                        <span className="settings-toggle-item__label">{t('settings.notifPrefs.securityAlerts')}</span>
                        <span className="settings-toggle-item__desc">{t('settings.notifPrefs.securityAlertsDesc')}</span>
                      </div>
                      <label className="settings-toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="settings-toggle__slider" />
                      </label>
                    </div>

                    <div className="settings-toggle-item">
                      <div>
                        <span className="settings-toggle-item__label">{t('settings.notifPrefs.productUpdates')}</span>
                        <span className="settings-toggle-item__desc">{t('settings.notifPrefs.productUpdatesDesc')}</span>
                      </div>
                      <label className="settings-toggle">
                        <input type="checkbox" defaultChecked={agreeMarketing} />
                        <span className="settings-toggle__slider" />
                      </label>
                    </div>

                    <div className="settings-toggle-item">
                      <div>
                        <span className="settings-toggle-item__label">{t('settings.notifPrefs.weeklyDigest')}</span>
                        <span className="settings-toggle-item__desc">{t('settings.notifPrefs.weeklyDigestDesc')}</span>
                      </div>
                      <label className="settings-toggle">
                        <input type="checkbox" />
                        <span className="settings-toggle__slider" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account tab */}
          {activeTab === 'account' && (
            <div className="settings-section">
              <div className="settings-card">
                <div className="settings-card__header">
                  <h2>{t('settings.account.title')}</h2>
                  <p>{t('settings.account.subtitle')}</p>
                </div>
                <div className="settings-card__body">
                  <div className="settings-info-grid">
                    <div className="settings-info-item">
                      <span className="settings-info-item__label">{t('settings.account.accountId')}</span>
                      <span className="settings-info-item__value">{user?._id || '—'}</span>
                    </div>
                    {!isSuperAdmin && (
                      <div className="settings-info-item">
                        <span className="settings-info-item__label">{t('settings.account.plan')}</span>
                        <span className="settings-info-item__value settings-info-item__value--badge">
                          {user?.tier ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1) : 'Gratuit'}
                        </span>
                      </div>
                    )}
                    <div className="settings-info-item">
                      <span className="settings-info-item__label">{t('settings.account.role')}</span>
                      <span className="settings-info-item__value">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Utilisateur'}
                      </span>
                    </div>
                    <div className="settings-info-item">
                      <span className="settings-info-item__label">{t('settings.account.memberSince')}</span>
                      <span className="settings-info-item__value">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {!isSuperAdmin && (
                <div className="settings-card settings-card--danger">
                  <div className="settings-card__header">
                    <h2>{t('settings.account.dangerTitle')}</h2>
                    <p>{t('settings.account.dangerSubtitle')}</p>
                  </div>
                  <div className="settings-card__body">
                    <div className="settings-danger-item">
                      <div>
                        <span className="settings-danger-item__label">{t('settings.account.deleteLabel')}</span>
                        <span className="settings-danger-item__desc">{t('settings.account.deleteDesc')}</span>
                      </div>
                      <button className="settings-btn settings-btn--danger" disabled>
                        {t('settings.account.deleteBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
