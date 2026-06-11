import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchNotifications,
  fetchNotificationById,
  markAsRead,
  markAllAsRead,
  clearSelectedNotification,
  setFilters,
  clearFilters,
  Notification
} from '../../store/slices/notificationsSlice';
import { t18n } from '../../utils/i18nString';
import BaseModal from '../../components/ui/BaseModal/BaseModal';
import './Notifications.scss';

// Icons
const SuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 18H14V16H10V18ZM3 6V8H21V6H3ZM6 13H18V11H6V13Z" fill="currentColor"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
  </svg>
);

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success': return <SuccessIcon />;
    case 'error':   return <ErrorIcon />;
    case 'warning': return <WarningIcon />;
    default:        return <InfoIcon />;
  }
};

const formatDate = (dateString: string, locale = 'en-US') => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: 'numeric'
  }).format(date);
};

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? 'ar' : 'en-US';
  const { id } = useParams<{ id?: string }>();
  const { notifications: rawNotifications, selectedNotification, unreadCount, isLoading, error, filters } = useAppSelector(state => state.notifications);
  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];
  const [selectedType, setSelectedType] = useState<string>(filters.type || 'all');
  const [selectedReadStatus, setSelectedReadStatus] = useState<string | boolean>(filters.isRead || 'all');
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      dispatch(fetchNotificationById(id));
      dispatch(markAsRead(id));
    } else {
      dispatch(clearSelectedNotification());
    }
  }, [dispatch, id]);

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleResetFilters = () => {
    setSelectedType('all');
    setSelectedReadStatus('all');
    dispatch(clearFilters());
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.type && filters.type !== 'all' && notification.type !== filters.type) return false;
    if (filters.isRead !== 'all') {
      if (filters.isRead === true  && !notification.isRead) return false;
      if (filters.isRead === false &&  notification.isRead) return false;
    }
    return true;
  });

  const handleViewNotification = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await dispatch(markAsRead(notification._id)).unwrap();
      }
      await dispatch(fetchNotificationById(notification._id)).unwrap();
      setShowDetailModal(true);
      dispatch(fetchNotifications());
    } catch (error) {
      console.error('Error handling notification view:', error);
    }
  };

  return (
    <div className="notifications-page">
      <motion.div
        className="notifications-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="hero-gradient-bg">
          <div className="hero-pattern" />
          <div className="hero-gradient-overlay" />
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-breadcrumb">
              <span className="breadcrumb-label">{t('notifications.breadcrumb')}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              <span className="breadcrumb-current">{t('notifications.title')}</span>
            </div>
            <h1 className="hero-title">
              <span className="hero-title-accent">{t('notifications.title')}</span>
            </h1>
            <p className="hero-subtitle">{t('notifications.subtitle')}</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-card">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{notifications.length}</span>
                <span className="stat-label">{t('notifications.total')}</span>
              </div>
            </div>
            <div className="hero-stat-card">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{unreadCount}</span>
                <span className="stat-label">{t('notifications.unread')}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="notifications-content">
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button className="btn-mark-all-read" onClick={handleMarkAllAsRead}>
              <CheckIcon /> {t('notifications.markAllRead')}
            </button>
          )}

          <div className="notifications-filters">
            <div className="filter-container">
              <FilterIcon />
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  dispatch(setFilters({ type: e.target.value as 'success' | 'error' | 'warning' | 'info' | 'all', isRead: filters.isRead }));
                }}
              >
                <option value="all">{t('notifications.filterType.all')}</option>
                <option value="info">{t('notifications.filterType.info')}</option>
                <option value="success">{t('notifications.filterType.success')}</option>
                <option value="warning">{t('notifications.filterType.warning')}</option>
                <option value="error">{t('notifications.filterType.error')}</option>
              </select>
            </div>

            <div className="filter-container">
              <FilterIcon />
              <select
                value={selectedReadStatus === 'all' ? 'all' : selectedReadStatus === true ? 'read' : 'unread'}
                onChange={(e) => {
                  const value = e.target.value;
                  const isReadValue = value === 'all' ? 'all' : value === 'read' ? true : false;
                  setSelectedReadStatus(isReadValue);
                  dispatch(setFilters({ type: filters.type, isRead: isReadValue }));
                }}
              >
                <option value="all">{t('notifications.filterStatus.all')}</option>
                <option value="read">{t('notifications.filterStatus.read')}</option>
                <option value="unread">{t('notifications.filterStatus.unread')}</option>
              </select>
            </div>

            <button className="btn-reset-filters" onClick={handleResetFilters}>
              {t('notifications.resetFilters')}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{t('notifications.errorMessage')}: {error}</p>
            <button className="btn-retry" onClick={() => dispatch(fetchNotifications())}>{t('common.retry')}</button>
          </div>
        ) : (
          <div className="notifications-table-container">
            <table className="notifications-table">
              <thead>
                <tr>
                  <th>{t('notifications.tableHeaders.type')}</th>
                  <th>{t('notifications.tableHeaders.title')}</th>
                  <th>{t('notifications.tableHeaders.message')}</th>
                  <th>{t('notifications.tableHeaders.date')}</th>
                  <th>{t('notifications.tableHeaders.status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map(notification => (
                  <motion.tr
                    key={notification._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`status-${notification.isRead ? 'read' : 'unread'}`}
                    onClick={() => handleViewNotification(notification)}
                  >
                    <td className="notification-type-cell">
                      <span className={`type-icon ${notification.type}`}>
                        {getNotificationIcon(notification.type)}
                      </span>
                    </td>
                    <td className="notification-title">{t18n(notification.title)}</td>
                    <td className="notification-message">{(() => { const m = t18n(notification.message); return m.length > 80 ? `${m.substring(0, 80)}…` : m; })()}</td>
                    <td>{formatDate(notification.createdAt, locale)}</td>
                    <td>
                      <span className={`status-badge ${notification.isRead ? 'read' : 'unread'}`}>
                        {notification.isRead ? t('notifications.readStatus') : t('notifications.unreadStatus')}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredNotifications.length === 0 && (
              <div className="no-results">
                <p>{t('notifications.noResults')}</p>
                {(filters.type !== 'all' || filters.isRead !== 'all') && (
                  <button className="btn-reset-filters" onClick={handleResetFilters}>
                    {t('notifications.resetFilters')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Notification Detail Modal ── */}
      <BaseModal
        show={showDetailModal && !!selectedNotification}
        onClose={() => setShowDetailModal(false)}
        icon={selectedNotification ? getNotificationIcon(selectedNotification.type) : undefined}
        title={selectedNotification ? t18n(selectedNotification.title) : ''}
        maxWidth="520px"
        footer={
          <>
            {selectedNotification?.link && (
              <a href={selectedNotification.link} className="bm-btn bm-btn--primary" target="_blank" rel="noopener noreferrer">
                {t('notifications.modal.learnMore')}
              </a>
            )}
            <button className="bm-btn bm-btn--cancel" onClick={() => setShowDetailModal(false)}>
              {t('common.close')}
            </button>
          </>
        }
      >
        {selectedNotification && (
          <>
            <div className="notification-meta" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="notification-date">{formatDate(selectedNotification.createdAt, locale)}</span>
              <span className={`notification-type-badge ${selectedNotification.type}`}>
                {t(`notifications.filterType.${selectedNotification.type}`)}
              </span>
            </div>

            <div className="notification-content">
              <p className="notification-message">{t18n(selectedNotification.message)}</p>
              {selectedNotification.content && (
                <div className="notification-html-content" dangerouslySetInnerHTML={{ __html: selectedNotification.content }} />
              )}
              {selectedNotification.image && (
                <div className="notification-image">
                  <img src={selectedNotification.image} alt={selectedNotification.title} />
                </div>
              )}
            </div>
          </>
        )}
      </BaseModal>
    </div>
  );
};

export default NotificationsPage;
