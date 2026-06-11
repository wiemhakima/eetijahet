// View — affichage pur. Toute la logique est dans useDeveloperController.
// Ce composant ne connaît ni Redux ni les appels API.

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, Bell, SquarePen, Trash2 } from 'lucide-react';

import { useDeveloperController } from '../../../mvc/developer/useDeveloperController';
import type { Developer, EditDeveloperForm, NotifyForm } from '../../../mvc/developer/types';
import BaseModal from '../../../components/ui/BaseModal/BaseModal';
import './AdminUsers.scss';

// ── Icons ─────────────────────────────────────────────────────────────────────

const UsersIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditModalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 0-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashModalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BellModalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ImpersonateModalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── View ──────────────────────────────────────────────────────────────────────

const AdminUsers: React.FC = () => {
  const { t } = useTranslation();

  // ← Controller : seule source de données et d'actions
  const ctrl = useDeveloperController();

  // Modal state (local à la View — purement UI)
  const [showEditModal,        setShowEditModal]        = useState(false);
  const [showDeleteModal,      setShowDeleteModal]      = useState(false);
  const [showNotifyModal,      setShowNotifyModal]      = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [selectedDev,          setSelectedDev]          = useState<Developer | null>(null);

  const [editForm, setEditForm] = useState<EditDeveloperForm>({
    firstName: '', lastName: '', email: '', tier: 'free', totalCredits: 0,
  });
  const [notifyForm, setNotifyForm] = useState<NotifyForm>({
    title: '', message: '', type: 'info',
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openEdit = (dev: Developer) => {
    setSelectedDev(dev);
    setEditForm({
      firstName:    dev.firstName,
      lastName:     dev.lastName,
      email:        dev.email,
      tier:         dev.tier,
      totalCredits: dev.activeApiSettings?.totalCredits ?? 0,
    });
    setShowEditModal(true);
  };

  const openDelete = (dev: Developer) => {
    setSelectedDev(dev);
    setShowDeleteModal(true);
  };

  const openNotify = (dev: Developer) => {
    setSelectedDev(dev);
    setNotifyForm({ title: '', message: '', type: 'info' });
    setShowNotifyModal(true);
  };

  const openImpersonate = (dev: Developer) => {
    setSelectedDev(dev);
    setShowImpersonateModal(true);
  };

  const confirmEdit = async () => {
    if (!selectedDev) return;
    await ctrl.editDeveloper(selectedDev._id, editForm);
    setShowEditModal(false);
    setSelectedDev(null);
  };

  const confirmDelete = async () => {
    if (!selectedDev) return;
    await ctrl.deleteDeveloper(selectedDev._id);
    setShowDeleteModal(false);
    setSelectedDev(null);
  };

  const confirmNotify = async () => {
    if (!selectedDev) return;
    await ctrl.notifyDeveloper(selectedDev._id, notifyForm);
    setShowNotifyModal(false);
    setSelectedDev(null);
  };

  const confirmImpersonate = async () => {
    if (!selectedDev) return;
    const token = await ctrl.impersonateDeveloper(selectedDev._id);
    const url   = `${window.location.origin}/impersonate?token=${token}`;
    const win   = window.open(url, `imp_${selectedDev._id}`, 'width=1400,height=900,scrollbars=yes');
    if (win) win.focus(); else window.open(url, '_blank');
    setShowImpersonateModal(false);
    setSelectedDev(null);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const getInitials = (dev: Developer) =>
    `${dev.firstName?.[0] ?? ''}${dev.lastName?.[0] ?? ''}`.toUpperCase();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="admin-users">
      {/* Hero Header */}
      <div className="admin-users-header">
        <div className="header-top">
          <div className="header-content">
            <div className="header-icon"><UsersIcon /></div>
            <div className="header-text">
              <h1>{t('adminUsers.title')}</h1>
              <p>{t('adminUsers.subtitle')}</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <div className="stat-value">{ctrl.totalDevelopers}</div>
              <div className="stat-label">{t('adminUsers.totalUsers')}</div>
            </div>
          </div>
        </div>
        <div className="header-toolbar">
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder={t('adminUsers.searchPlaceholder')}
              value={ctrl.search}
              onChange={(e) => ctrl.handleSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              value={ctrl.tierFilter}
              onChange={(e) => ctrl.handleTierFilter(e.target.value)}
            >
              <option value="">{t('adminUsers.allTiers')}</option>
              <option value="free">{t('adminUsers.tierFree')}</option>
              <option value="basic">{t('adminUsers.tierBasic')}</option>
              <option value="premium">{t('adminUsers.tierPremium')}</option>
              <option value="enterprise">{t('adminUsers.tierEnterprise')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="users-content">
        <div className="users-table-container">
          {ctrl.isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>{t('adminUsers.loading')}</p>
            </div>
          ) : ctrl.developers.length === 0 ? (
            <div className="empty-state">
              <UsersIcon />
              <p>{t('adminUsers.noUsers')}</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('adminUsers.colUser')}</th>
                  <th>{t('adminUsers.colTier')}</th>
                  <th>{t('adminUsers.colApiCredits')}</th>
                  <th>{t('adminUsers.colJoined')}</th>
                  <th>{t('adminUsers.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {ctrl.developers.map((dev) => (
                  <tr key={dev._id} className="dev-row">
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{getInitials(dev)}</div>
                        <div className="user-info">
                          <div className="user-name">{dev.firstName} {dev.lastName}</div>
                          <div className="user-email">{dev.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="tier-badge">{dev.tier}</span></td>
                    <td className="credits-cell">
                      {dev.activeApiSettings?.totalCredits?.toLocaleString() ?? '0'}
                    </td>
                    <td className="date-cell">{formatDate(dev.createdAt)}</td>
                    <td className="actions-cell">
                      <div className="user-actions">
                        <button className="btn-action login"  onClick={() => openImpersonate(dev)} title={t('adminUsers.impersonateUser')}><LogIn     size={17} /></button>
                        <button className="btn-action bell"   onClick={() => openNotify(dev)}      title={t('adminUsers.sendNotification')}><Bell      size={17} /></button>
                        <button className="btn-action edit"   onClick={() => openEdit(dev)}        title={t('adminUsers.editUser')}><SquarePen  size={17} /></button>
                        <button className="btn-action danger" onClick={() => openDelete(dev)}      title={t('adminUsers.deleteUser')}><Trash2     size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {ctrl.pagination && ctrl.pagination.pages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={ctrl.currentPage === 1}
              onClick={() => ctrl.setCurrentPage(p => p - 1)}
            >
              <ChevronLeftIcon />
            </button>
            {Array.from({ length: Math.min(5, ctrl.pagination.pages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn ${ctrl.currentPage === page ? 'active' : ''}`}
                onClick={() => ctrl.setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={ctrl.currentPage === ctrl.pagination.pages}
              onClick={() => ctrl.setCurrentPage(p => p + 1)}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      <BaseModal
        show={showEditModal && !!selectedDev}
        onClose={() => setShowEditModal(false)}
        title={t('adminUsers.editUser')}
        icon={<EditModalIcon />}
        maxWidth="600px"
        footer={
          <>
            <button className="bm-btn bm-btn--cancel"  onClick={() => setShowEditModal(false)}>{t('common.cancel')}</button>
            <button className="bm-btn bm-btn--primary"  onClick={confirmEdit}>{t('adminUsers.saveChanges')}</button>
          </>
        }
      >
        {selectedDev && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>{t('adminUsers.firstName')}</label>
                <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{t('adminUsers.lastName')}</label>
                <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>{t('adminUsers.emailAddress')}</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('adminUsers.colTier')}</label>
                <select value={editForm.tier} onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}>
                  <option value="free">{t('adminUsers.tierFree')}</option>
                  <option value="basic">{t('adminUsers.tierBasic')}</option>
                  <option value="premium">{t('adminUsers.tierPremium')}</option>
                  <option value="enterprise">{t('adminUsers.tierEnterprise')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('adminUsers.apiCredits')}</label>
                <input
                  type="number" min="0"
                  value={editForm.totalCredits}
                  onChange={(e) => setEditForm({ ...editForm, totalCredits: parseInt(e.target.value) || 0 })}
                />
                <span className="field-hint">
                  {t('adminUsers.currentBalance')}: {selectedDev.activeApiSettings?.totalCredits?.toLocaleString() ?? '0'} {t('adminUsers.credits')}
                </span>
              </div>
            </div>
          </>
        )}
      </BaseModal>

      {/* ── Delete Modal ── */}
      <BaseModal
        show={showDeleteModal && !!selectedDev}
        onClose={() => setShowDeleteModal(false)}
        title={t('adminUsers.deleteUser')}
        icon={<TrashModalIcon />}
        maxWidth="460px"
        footer={
          <>
            <button className="bm-btn bm-btn--cancel" onClick={() => setShowDeleteModal(false)}>{t('common.cancel')}</button>
            <button className="bm-btn bm-btn--danger"  onClick={confirmDelete}>{t('adminUsers.deleteUser')}</button>
          </>
        }
      >
        {selectedDev && (
          <div className="warning-message">
            <p>{t('adminUsers.deleteConfirm')} <strong>{selectedDev.firstName} {selectedDev.lastName}</strong>?</p>
            <p className="warning-text">{t('adminUsers.deleteWarning')}</p>
          </div>
        )}
      </BaseModal>

      {/* ── Notify Modal ── */}
      <BaseModal
        show={showNotifyModal && !!selectedDev}
        onClose={() => setShowNotifyModal(false)}
        title={t('adminUsers.sendNotification')}
        icon={<BellModalIcon />}
        maxWidth="480px"
        footer={
          <>
            <button className="bm-btn bm-btn--cancel"  onClick={() => setShowNotifyModal(false)}>{t('common.cancel')}</button>
            <button className="bm-btn bm-btn--primary"  onClick={confirmNotify}>{t('adminUsers.sendNotification')}</button>
          </>
        }
      >
        {selectedDev && (
          <>
            <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
              {t('adminUsers.sendTo')} <strong>{selectedDev.firstName} {selectedDev.lastName}</strong>
            </p>
            <div className="form-group">
              <label>{t('adminUsers.notifTitle')}</label>
              <input type="text" value={notifyForm.title} onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{t('adminUsers.notifMessage')}</label>
              <textarea rows={4} value={notifyForm.message} onChange={(e) => setNotifyForm({ ...notifyForm, message: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{t('adminUsers.notifType')}</label>
              <select value={notifyForm.type} onChange={(e) => setNotifyForm({ ...notifyForm, type: e.target.value as NotifyForm['type'] })}>
                <option value="info">{t('common.info')}</option>
                <option value="success">{t('common.success')}</option>
                <option value="warning">{t('common.warning')}</option>
                <option value="error">{t('common.error')}</option>
              </select>
            </div>
          </>
        )}
      </BaseModal>

      {/* ── Impersonate Modal ── */}
      <BaseModal
        show={showImpersonateModal && !!selectedDev}
        onClose={() => setShowImpersonateModal(false)}
        title={t('adminUsers.impersonateUser')}
        icon={<ImpersonateModalIcon />}
        maxWidth="460px"
        footer={
          <>
            <button className="bm-btn bm-btn--cancel" onClick={() => setShowImpersonateModal(false)}>{t('common.cancel')}</button>
            <button className="btn-impersonate" onClick={confirmImpersonate}>
              <ImpersonateModalIcon />
              {t('adminUsers.openAs')} {selectedDev?.firstName}
              <ExternalLinkIcon />
            </button>
          </>
        }
      >
        {selectedDev && (
          <div className="impersonate-info">
            <div className="user-preview">
              <div className="user-avatar large">{getInitials(selectedDev)}</div>
              <div className="user-details">
                <h3>{selectedDev.firstName} {selectedDev.lastName}</h3>
                <p>{selectedDev.email}</p>
                <span className={`role-badge role-${selectedDev.role}`}>{selectedDev.role}</span>
              </div>
            </div>
            <div className="impersonate-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <strong>{t('adminUsers.important')}:</strong> {t('adminUsers.impersonateWarning')}
              </div>
            </div>
          </div>
        )}
      </BaseModal>
    </div>
  );
};

export default AdminUsers;
