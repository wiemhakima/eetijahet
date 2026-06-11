import './Header.scss';
import { t18n } from '../../../../utils/i18nString';

import {
  Notification,
  fetchNotifications,
  markAllAsRead,
  markAsRead
} from '../../../../store/slices/notificationsSlice';
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { useTranslation } from 'react-i18next';

import Avatar from '../../../../components/Avatar';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { NotificationBell } from '../../../../components/NotificationBell';
import { logout } from '../../../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

// Simple flat icons
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface HeaderProps {
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
}

// Helper function to format notification time
const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Helper function to get the appropriate icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="17" r="1" fill="currentColor"/>
        </svg>
      );
    case 'info':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="8" r="1" fill="currentColor"/>
        </svg>
      );
    case 'success':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" fill="none"/>
          <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'error':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="8" r="1" fill="currentColor"/>
        </svg>
      );
  }
};

const Header: React.FC<HeaderProps> = ({
  showNotifications,
  setShowNotifications,
  showUserMenu,
  setShowUserMenu
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { user } = useAppSelector(state => state.auth);
  const rawNotifState = useAppSelector(state => state.notifications);
  const notifications = {
    ...rawNotifState,
    notifications: Array.isArray(rawNotifState.notifications) ? rawNotifState.notifications : [],
  };
  
  // Fetch notifications when component mounts
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification._id));
    }
    
    // If notification has a link, navigate to it
    if (notification.link) {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent closing the dropdown
    dispatch(markAllAsRead());
  };
  
  return (
    <header className="aws-header">
      <div className="aws-header__content">
        {/* Left Section - Branding */}
        <div className="aws-header__left">
          <span className="aws-header__brand">{t('dashboardHeader.brand')}</span>
        </div>

        {/* Right Section - Actions */}
        <div className="aws-header__right">
          {/* Language Selector */}
          <LanguageSwitcher variant="dark" />

          {/* Notifications */}
          <div className="aws-header__action">
            {user?.role === 'agency_admin' ? (
              <NotificationBell />
            ) : (
              <>
                <button
                  className={`aws-header__icon-btn ${showNotifications ? 'aws-header__icon-btn--active' : ''}`}
                  onClick={() => {
                    if (!showNotifications && notifications.unreadCount > 0) {
                      dispatch(markAllAsRead());
                    }
                    setShowNotifications(!showNotifications);
                  }}
                  aria-label="Notifications"
                >
                  <BellIcon />
                  {notifications.unreadCount > 0 && (
                    <span className="aws-header__badge">{notifications.unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="aws-dropdown aws-dropdown--notifications">
                    <div className="aws-dropdown__header">
                      <span className="aws-dropdown__title">{t('dashboardHeader.notifications')}</span>
                      {notifications.unreadCount > 0 && (
                        <button className="aws-dropdown__action-link" onClick={handleMarkAllAsRead}>
                          {t('dashboardHeader.markAllRead')}
                        </button>
                      )}
                    </div>

                    <div className="aws-dropdown__body">
                      {notifications.isLoading ? (
                        <div className="aws-dropdown__empty">
                          <span>{t('dashboardHeader.loading')}</span>
                        </div>
                      ) : notifications.error ? (
                        <div className="aws-dropdown__empty">
                          <span>{t('dashboardHeader.errorLoading')}</span>
                        </div>
                      ) : notifications.notifications.length === 0 ? (
                        <div className="aws-dropdown__empty">
                          <BellIcon />
                          <span>{t('dashboardHeader.noNotifications')}</span>
                        </div>
                      ) : (
                        <div className="aws-notification-list">
                          {notifications.notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification._id}
                              className={`aws-notification-item ${!notification.isRead ? 'aws-notification-item--unread' : ''}`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className={`aws-notification-item__icon aws-notification-item__icon--${notification.type}`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="aws-notification-item__content">
                                <div className="aws-notification-item__title">{t18n(notification.title)}</div>
                                <div className="aws-notification-item__desc">{t18n(notification.message)}</div>
                                <div className="aws-notification-item__time">{formatNotificationTime(notification.createdAt)}</div>
                              </div>
                              {!notification.isRead && <div className="aws-notification-item__dot" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="aws-dropdown__footer">
                      <button
                        className="aws-dropdown__footer-btn"
                        onClick={() => {
                          navigate('/dashboard/notifications');
                          setShowNotifications(false);
                        }}
                      >
                        {t('dashboardHeader.viewAll')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="aws-header__action">
            <button 
              className={`aws-header__user-btn ${showUserMenu ? 'aws-header__user-btn--active' : ''}`}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Avatar 
                firstName={user?.firstName} 
                lastName={user?.lastName} 
                size="medium"
              />
              <span className="aws-header__user-name">
                {user ? user.firstName : t('dashboardHeader.guest')}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            
            {showUserMenu && (
              <div className="aws-dropdown aws-dropdown--user">
                <div className="aws-dropdown__user-info">
                  <Avatar 
                    firstName={user?.firstName} 
                    lastName={user?.lastName} 
                    size="large"
                  />
                  <div>
                    <div className="aws-dropdown__user-name">{user ? `${user.firstName} ${user.lastName}` : t('dashboardHeader.guest')}</div>
                    <div className="aws-dropdown__user-email">{user ? user.email : t('dashboardHeader.guestEmail')}</div>
                  </div>
                </div>
                
                <div className="aws-dropdown__divider" />
                
                <div className="aws-dropdown__menu">
                  <button className="aws-dropdown__menu-item" onClick={() => {
                    const isAgency = user?.role === 'agency_admin' || user?.role === 'gestionnaire_agency';
                    navigate(isAgency ? '/agency/settings?tab=profil' : '/dashboard/profile');
                  }}>
                    <UserIcon />
                    <span>{t('dashboardHeader.profileSettings')}</span>
                  </button>
                  <button className="aws-dropdown__menu-item" onClick={() => {
                    const isAgency = user?.role === 'agency_admin' || user?.role === 'gestionnaire_agency';
                    navigate(isAgency ? '/agency/settings?tab=compte' : '/dashboard/settings');
                  }}>
                    <SettingsIcon />
                    <span>{t('dashboardHeader.preferences')}</span>
                  </button>
                  <div className="aws-dropdown__divider" />
                  <button className="aws-dropdown__menu-item aws-dropdown__menu-item--danger" onClick={handleLogout}>
                    <LogoutIcon />
                    <span>{t('dashboardHeader.signOut')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
