import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAdminUsersController } from '../../../controllers/useAdminUsersController';
import type { AdminUser } from '../../../models/AdminModel';
import BaseModal from '../../../components/ui/BaseModal/BaseModal';
import './AdminNotifications.scss';

// ── Arabic content translation map ────────────────────────────────────────────

const ORDER_TITLES = ['Delivered!', 'On the way', 'Package picked up'];

type I18nString = string | { en?: string; ar?: string };

const AR_TITLES: Record<string, string> = {
  'Subscription updated':                 'تم تحديث الاشتراك',
  'Subscription cancellation scheduled':  'تم جدولة إلغاء الاشتراك',
  'Welcome to the team!':                 'مرحباً بك في الفريق!',
  'Welcome to Armada Etijahat!':          'مرحباً بك في Armada Etijahat!',
};

const AR_MESSAGES: Record<string, string> = {
  'Your agency is now on the Pro plan (monthly billing)':
    'وكالتك الآن على الخطة الاحترافية (فوترة شهرية)',
  'Your agency is now on the Medium plan (annual billing)':
    'وكالتك الآن على الخطة المتوسطة (فوترة سنوية)',
  'Your subscription will remain active until Tue May 18 2027 and will not renew':
    'سيبقى اشتراكك نشطاً حتى الثلاثاء 18 مايو 2027 ولن يتجدد تلقائياً',
  'You have been added as a driver for ARAMAX-Agency':
    'تمت إضافتك كسائق في وكالة ARAMAX',
  'Your 14-day free trial has started. Explore all Basic features and upgrade anytime.':
    'بدأت تجربتك المجانية لمدة 14 يوماً. استكشف جميع الميزات الأساسية وقم بالترقية في أي وقت.',
};

function localizeText(map: Record<string, string>, value: I18nString, isAr: boolean): string {
  if (typeof value === 'object' && value !== null) {
    return isAr ? (value.ar ?? value.en ?? '') : (value.en ?? '');
  }
  if (!isAr) return value;
  if (map[value]) return map[value];
  const welcomeMatch = value.match(/^Welcome (\w+)!/);
  if (welcomeMatch) return `مرحباً ${welcomeMatch[1]}! يسعدنا انضمامك إلينا. ابدأ باستكشاف خدماتنا وأخبرنا إن احتجت أي مساعدة.`;
  const cancelMatch = value.match(/^Your subscription will remain active until (.+?) and will not renew/);
  if (cancelMatch) return `سيبقى اشتراكك نشطاً حتى ${cancelMatch[1]} ولن يتجدد تلقائياً`;
  return value;
}

const isArabicText = (text: string) => /[؀-ۿ]/.test(text);

// ── Icons ─────────────────────────────────────────────────────────────────────

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
  </svg>
);
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

const AdminNotifications: React.FC = () => {
  const ctrl = useAdminUsersController();
  const { t, i18n } = useTranslation();
  const { notifications: rawNotifs, users: rawUsers, isLoading } = ctrl;
  const notifications = Array.isArray(rawNotifs) ? rawNotifs : [];
  const users         = Array.isArray(rawUsers)  ? rawUsers  : [];
  const isAr = i18n.language === 'ar';

  const [showModal, setShowModal] = useState(false);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [form, setForm] = useState({
    title:   '',
    message: '',
    type:    'info' as 'info' | 'success' | 'warning' | 'error',
    userId:  ''
  });

  useEffect(() => {
    ctrl.loadNotifications({ userRole: 'developer' });
    ctrl.loadUsers({ limit: 100, role: 'developer' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBroadcast) {
      await ctrl.broadcastNotification({ title: form.title, message: form.message, type: form.type });
    } else {
      await ctrl.sendNotification({ title: form.title, message: form.message, type: form.type, userId: form.userId });
    }
    setShowModal(false);
    setForm({ title: '', message: '', type: 'info', userId: '' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('adminNotifications.deleteConfirm'))) {
      await ctrl.deleteNotification(id);
    }
  };

  const openModal = (broadcast: boolean) => {
    setIsBroadcast(broadcast);
    setShowModal(true);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString(i18n.language === 'ar' ? 'ar' : 'en-US');

  const getTypeColor = (type: string) => ({
    success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6'
  }[type] || '#3b82f6');

  const badgeLabel = (type: string) =>
    t(`adminNotifications.type${type.charAt(0).toUpperCase()}${type.slice(1)}`);

  const getRecipientLabel = (notif: typeof notifications[number]) => {
    if (!notif.user || notif.global) return t('adminNotifications.allDevelopers');
    return `${t('adminNotifications.toLabel')} ${notif.user.firstName} ${notif.user.lastName}`;
  };

  const developerNotifications = notifications.filter((n) => {
    if (ORDER_TITLES.includes(n.title ?? '')) return false;
    if (n.user && n.user.role !== 'developer') return false;
    return true;
  });

  return (
    <div className="admin-notifications">

      {/* ── Page header ── */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon"><BellIcon /></div>
          <div className="header-text">
            <h1>{t('adminNotifications.title')}</h1>
            <p>{t('adminNotifications.subtitle')}</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => openModal(false)}>
            <SendIcon /> {t('adminNotifications.sendToUser')}
          </button>
          <button className="btn-primary" onClick={() => openModal(true)}>
            <BellIcon /> {t('adminNotifications.broadcastAll')}
          </button>
        </div>
      </div>

      {/* ── Notification list ── */}
      <div className="notifications-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>{t('adminNotifications.loading')}</p>
          </div>
        ) : developerNotifications.length === 0 ? (
          <div className="empty-state">
            <BellIcon />
            <p>{t('adminNotifications.empty')}</p>
          </div>
        ) : (
          developerNotifications.map((notification) => {
            const type         = notification.type ?? 'info';
            const localTitle   = localizeText(AR_TITLES,   notification.title   ?? (isAr ? 'إشعار' : 'Notification'), isAr);
            const localMessage = localizeText(AR_MESSAGES, notification.message ?? '',                                  isAr);
            const messageDir   = isArabicText(localMessage) ? 'rtl' : 'ltr';
            const titleDir     = isArabicText(localTitle)   ? 'rtl' : 'ltr';

            return (
              <motion.div
                key={notification._id}
                className="notification-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="notification-indicator" style={{ backgroundColor: getTypeColor(type) }} />
                <div className="notification-content">
                  <div className="notification-header">
                    <h3 dir={titleDir}>{localTitle}</h3>
                    <span className={`type-badge type-${type}`}>{badgeLabel(type)}</span>
                    {notification.global && <span className="broadcast-badge">{t('adminNotifications.broadcastBadge')}</span>}
                    <button className="delete-btn" onClick={() => handleDelete(notification._id)} title={t('adminNotifications.deleteTooltip') || 'Delete'}>
                      <TrashIcon />
                    </button>
                  </div>
                  <p className="notification-message" dir={messageDir}>{localMessage}</p>
                  <div className="notification-meta">
                    <span className="recipient">{getRecipientLabel(notification)}</span>
                    <span className="timestamp">{formatDate(notification.createdAt)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Broadcast / send modal ── */}
      <BaseModal
        show={showModal}
        onClose={() => setShowModal(false)}
        icon={isBroadcast ? <BellIcon /> : <SendIcon />}
        title={isBroadcast ? t('adminNotifications.modalBroadcast') : t('adminNotifications.modalSend')}
        maxWidth="480px"
      >
        <form onSubmit={handleSubmit} className="notification-form">
          {!isBroadcast && (
            <div className="form-group">
              <label>{t('adminNotifications.formRecipient')}</label>
              <select value={form.userId} onChange={(e) => setForm({...form, userId: e.target.value})} required>
                <option value="">{t('adminNotifications.formSelectUser')}</option>
                <optgroup label={`⚡ Developers (${users.length})`}>
                  {users.length === 0 ? (
                    <option value="" disabled>Aucun développeur disponible</option>
                  ) : (
                    users.map((user: AdminUser) => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))
                  )}
                </optgroup>
              </select>
            </div>
          )}
          <div className="form-group">
            <label>{t('adminNotifications.formTitle')}</label>
            <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder={t('adminNotifications.formTitlePlaceholder')} required />
          </div>
          <div className="form-group">
            <label>{t('adminNotifications.formMessage')}</label>
            <textarea value={form.message} onChange={(e) => setForm({...form, message: e.target.value})}
              placeholder={t('adminNotifications.formMessagePlaceholder')} rows={4} required />
          </div>
          <div className="form-group">
            <label>{t('adminNotifications.formType')}</label>
            <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value as typeof form.type})}>
              <option value="info">{t('adminNotifications.typeInfo')}</option>
              <option value="success">{t('adminNotifications.typeSuccess')}</option>
              <option value="warning">{t('adminNotifications.typeWarning')}</option>
              <option value="error">{t('adminNotifications.typeError')}</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="bm-btn bm-btn--cancel" onClick={() => setShowModal(false)}>
              {t('adminNotifications.cancelBtn')}
            </button>
            <button type="submit" className="bm-btn bm-btn--primary">
              {isBroadcast ? t('adminNotifications.broadcastBtn') : t('adminNotifications.sendBtn')}
            </button>
          </div>
        </form>
      </BaseModal>
    </div>
  );
};

export default AdminNotifications;
