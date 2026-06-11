import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api';
import { Agency, TeamMember } from './types';
import ProfileTab from './tabs/ProfileTab';
import ZonesTab from './tabs/ZonesTab';
import HoursTab from './tabs/HoursTab';
import TeamTab from './tabs/TeamTab';
import NotificationsTab from './tabs/NotificationsTab';
import { useAppSelector } from '../../../store/hooks';
import './Settings.scss';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector(state => state.auth);
  const rawTab    = searchParams.get('tab') || 'profile';
  const initialTab = rawTab === 'profil' ? 'profile' : rawTab;
  const [activeTab, setActiveTab]         = useState(initialTab);
  const [agency, setAgency]               = useState<Agency | null>(null);
  const [loading, setLoading]             = useState(true);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({ settings: true, team: true });

  const TABS = [
    { id: 'profile',       label: t('agency.settings.tabProfile'),       icon: '🏢' },
    { id: 'zones',         label: t('agency.settings.tabZones'),          icon: '📍' },
    { id: 'hours',         label: t('agency.settings.tabHours'),          icon: '🕐' },
    { id: 'team',          label: t('agency.settings.tabTeam'),           icon: '👥' },
    { id: 'notifications', label: t('agency.settings.tabNotifications'),  icon: '🔔' },
    { id: 'compte',        label: t('agency.settings.tabAccount'),        icon: 'ℹ️' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/v1/agencies/me/settings');
      setAgency(res.data.agency);

      const currentUserId = localStorage.getItem('userId');
      const member = res.data.agency.team?.find((m: TeamMember) => m.user?._id === currentUserId);
      setUserPermissions(member?.permissions ?? { settings: true, team: true });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updatedAgency: Agency) => setAgency(updatedAgency);

  const isTabLocked = (tabId: string) => {
    if (tabId === 'compte') return false;
    if (tabId === 'team') return !userPermissions.team;
    return !userPermissions.settings;
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <div className="settings-spinner" />
          <p>{t('agency.settings.loading')}</p>
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="settings-page">
        <div className="settings-empty">{t('agency.settings.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>{t('agency.settings.title')}</h1>
        <p>{t('agency.settings.subtitle')}</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar tabs */}
        <aside className="settings-tabs">
          {TABS.map(tab => {
            const locked = isTabLocked(tab.id);
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => !locked && setActiveTab(tab.id)}
              >
                <span className="settings-tab__icon">{tab.icon}</span>
                <span className="settings-tab__label">{tab.label}</span>
                {locked && <span className="settings-tab__lock">🔒</span>}
              </button>
            );
          })}
        </aside>

        {/* Tab content */}
        <div className="settings-content">
          {activeTab === 'profile'       && <ProfileTab       agency={agency} onUpdate={handleUpdate} />}
          {activeTab === 'zones'         && <ZonesTab         agency={agency} onUpdate={handleUpdate} />}
          {activeTab === 'hours'         && <HoursTab         agency={agency} onUpdate={handleUpdate} />}
          {activeTab === 'team'          && <TeamTab          agency={agency} onUpdate={handleUpdate} />}
          {activeTab === 'notifications' && <NotificationsTab agency={agency} onUpdate={handleUpdate} />}
          {activeTab === 'compte'        && (
            <div className="settings-section">
              <h2>{t('agency.settings.accountTitle')}</h2>
              <p>{t('agency.settings.accountSubtitle')}</p>

              <div className="account-details-grid">
                <div className="account-detail-card">
                  <label>{t('agency.settings.accountId')}</label>
                  <span>{user?._id}</span>
                </div>
                <div className="account-detail-card">
                  <label>{t('agency.settings.accountPlan')}</label>
                  <span className="plan-badge">{agency?.subscription?.plan || 'Free'}</span>
                </div>
                <div className="account-detail-card">
                  <label>{t('agency.settings.accountRole')}</label>
                  <span style={{ textTransform: 'capitalize' }}>
                    {user?.role === 'agency_admin'
                      ? t('agency.settings.accountRoleAdmin')
                      : t('agency.settings.accountRoleManager')}
                  </span>
                </div>
                <div className="account-detail-card">
                  <label>{t('agency.settings.accountMemberSince')}</label>
                  <span>
                    {new Date(user?.createdAt || agency?.createdAt || Date.now()).toLocaleDateString(undefined, {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {user?.role === 'agency_admin' && (
                <div style={{
                  marginTop: 32,
                  border: '1px solid #fecaca',
                  borderRadius: 12,
                  padding: 24,
                  background: '#fff5f5',
                }}>
                  <h3 style={{ color: '#dc2626', margin: '0 0 4px' }}>{t('agency.settings.dangerZoneTitle')}</h3>
                  <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px' }}>
                    {t('agency.settings.dangerZoneSubtitle')}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderTop: '1px solid #fecaca',
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#1e293b' }}>{t('agency.settings.deleteTitle')}</p>
                      <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        {t('agency.settings.deleteDesc')}
                      </p>
                    </div>
                    <button
                      style={{
                        padding: '8px 18px',
                        border: '1px solid #fca5a5',
                        borderRadius: 8,
                        background: 'transparent',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        marginLeft: 24,
                      }}
                      onClick={() => {
                        if (window.confirm(t('agency.settings.deleteConfirm'))) {
                          // handle delete
                        }
                      }}
                    >
                      {t('agency.settings.deleteBtn')}
                    </button>
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
