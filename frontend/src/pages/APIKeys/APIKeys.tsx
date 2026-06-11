import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApiKeyController } from '../../controllers/useApiKeyController';
import type { ApiKey } from '../../models/ApiKeyModel';
import { PlusIcon, SearchIcon, FilterIcon, CopyIcon, CloseIcon } from './ServiceIcons';
import BaseModal from '../../components/ui/BaseModal/BaseModal';
import i18n from '../../i18n';
import './APIKeys.scss';

const getLocale = () => (i18n.language === 'ar' ? 'ar' : 'en-US');

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(getLocale(), {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(getLocale(), {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const SuccessKeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

interface ActionDropdownProps {
  apiKey: ApiKey;
  onCopy: (key: ApiKey) => void;
  onRevoke: (id: string) => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ apiKey, onCopy, onRevoke }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn-icon" onClick={() => setOpen(v => !v)} title={t('common.actions')}>
        ⋯
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div className="dropdown-menu">
            <button className="dropdown-item" onClick={() => { onCopy(apiKey); setOpen(false); }}>
              📋 {t('common.copy')}
            </button>
            <button className="dropdown-item" onClick={() => { alert(t('dashboard.comingSoonFeature')); setOpen(false); }}>
              ✏️ {t('apikeys.editKey')}
            </button>
            {apiKey.status === 'active' && (
              <button className="dropdown-item danger" onClick={() => { onRevoke(apiKey._id); setOpen(false); }}>
                🚫 {t('apikeys.revokeKey')}
              </button>
            )}
            {apiKey.status === 'revoked' && (
              <button className="dropdown-item success" onClick={() => { alert(t('dashboard.comingSoonFeature')); setOpen(false); }}>
                ✅ {t('common.active')}
              </button>
            )}
            <button className="dropdown-item danger" onClick={() => { alert(t('dashboard.comingSoonFeature')); setOpen(false); }}>
              🗑️ {t('adminUsers.deleteUser')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const APIKeys: React.FC = () => {
  const { t } = useTranslation();
  const ctrl = useApiKeyController();
  const navigate = useNavigate();
  const { apiKeys: rawApiKeys, isLoading, error, newKey } = ctrl;
  const apiKeys = Array.isArray(rawApiKeys) ? rawApiKeys : [];

  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    expiration: 'never',
    permissions: ['time_estimation', 'distance_estimation'],
  });
  const [showNewKeySuccess, setShowNewKeySuccess] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (newKey) {
      setNewKeyValue(newKey.key);
      setShowNewKeySuccess(true);
      ctrl.clearNewKey();
    }
  }, [newKey]);

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus ? key.status === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  const handleCreateKey = async () => {
    try {
      await ctrl.create({ name: newKeyData.name, permissions: newKeyData.permissions });
      setShowNewKeyModal(false);
    } catch (err) {
      console.error('Failed to create API key:', err);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (window.confirm(t('apikeys.confirmRevoke'))) {
      try {
        await ctrl.revoke(keyId);
      } catch (err) {
        console.error('Failed to revoke API key:', err);
      }
    }
  };

  const handleCopyKey = (key: ApiKey) => {
    navigator.clipboard.writeText(key.key);
    setCopiedId(key._id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const statusLabels: Record<string, string> = {
    active: t('common.active'),
    expired: t('common.expired'),
    revoked: t('common.revoked'),
  };

  return (
    <div className="apikeys-page">
      <motion.div
        className="apikeys-hero"
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
              <span className="breadcrumb-label">{t('apikeys.breadcrumb')}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              <span className="breadcrumb-current">{t('apikeys.title')} {t('apikeys.titleAccent')}</span>
            </div>
            <h1 className="hero-title">
              {t('apikeys.title')} <span className="hero-title-accent">{t('apikeys.titleAccent')}</span>
            </h1>
            <p className="hero-subtitle">{t('apikeys.subtitle')}</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-card">
              <div className="stat-value">{apiKeys.filter(k => k.status === 'active').length}</div>
              <div className="stat-label">{t('apikeys.activeKeys')}</div>
            </div>
            <div className="hero-stat-card">
              <div className="stat-value">{apiKeys.length}</div>
              <div className="stat-label">{t('apikeys.totalKeys')}</div>
            </div>
            <div className="hero-stat-card">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">{t('apikeys.uptime')}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="apikeys-content">
        <div className="apikeys-actions">
          <button className="btn-create-key" onClick={() => navigate('/dashboard/api-keys/create')}>
            <PlusIcon /> {t('apikeys.createNew')}
          </button>

          <div className="apikeys-filters">
            <div className="search-container">
              <SearchIcon />
              <input type="text" placeholder={t('apikeys.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="filter-container">
              <FilterIcon />
              <select value={selectedStatus || ''} onChange={(e) => setSelectedStatus(e.target.value || null)}>
                <option value="">{t('apikeys.allStatuses')}</option>
                <option value="active">{t('common.active')}</option>
                <option value="expired">{t('common.expired')}</option>
                <option value="revoked">{t('common.revoked')}</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container"><div className="loading-spinner"></div><p>{t('apikeys.loadingKeys')}</p></div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{t('apikeys.errorLoading')} {error}</p>
            <button className="btn-retry" onClick={() => ctrl.load()}>{t('apikeys.retry')}</button>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔑</div>
            <h3>{t('apikeys.noKeysFound')}</h3>
            <button className="btn-create-key" onClick={() => navigate('/dashboard/api-keys/create')}><PlusIcon /> {t('apikeys.createNew')}</button>
          </div>
        ) : (
          <div className="apikeys-table-container">
            <table className="apikeys-table">
              <thead>
                <tr>
                  <th>{t('apikeys.tableHeaders.name')}</th>
                  <th>{t('apikeys.tableHeaders.key')}</th>
                  <th>{t('apikeys.tableHeaders.created')}</th>
                  <th>{t('apikeys.tableHeaders.expires')}</th>
                  <th>{t('apikeys.tableHeaders.status')}</th>
                  <th>{t('apikeys.tableHeaders.permissions')}</th>
                  <th>{t('apikeys.tableHeaders.lastUsed')}</th>
                  <th>{t('apikeys.tableHeaders.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map(key => (
                  <motion.tr key={key._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`status-${key.status}`}>
                    <td className="key-name" title={key.name}>{key.name}</td>
                    <td className="col-key">
                      <div className="key-display">
                        <span className="key-prefix-mono">{key.prefix || 'etj_'}••••••••••••••••</span>
                        <button className={`btn-copy-inline ${copiedId === key._id ? 'copied' : ''}`} onClick={() => handleCopyKey(key)} title={t('common.copy')}>
                          {copiedId === key._id ? '✓' : '📋'}
                        </button>
                      </div>
                    </td>
                    <td title={formatDate(key.created)}>{formatDate(key.created)}</td>
                    <td title={key.expires ? formatDate(key.expires) : t('common.never')}>{key.expires ? formatDate(key.expires) : t('common.never')}</td>
                    <td className="col-statut"><span className={`badge-${key.status}`}>{statusLabels[key.status] ?? key.status}</span></td>
                    <td>
                      <div className="permissions-list">
                        {key.permissions.slice(0, 2).map((perm, i) => <span key={i} className="permission-badge" title={perm}>{perm}</span>)}
                        {key.permissions.length > 2 && <span className="permission-badge" title={key.permissions.slice(2).join(', ')}>+{key.permissions.length - 2}</span>}
                      </div>
                    </td>
                    <td title={formatDateTime(key.lastUsed)}>{formatDateTime(key.lastUsed)}</td>
                    <td className="actions-cell"><ActionDropdown apiKey={key} onCopy={handleCopyKey} onRevoke={handleRevokeKey} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredKeys.length === 0 && <div className="no-results"><p>{t('apikeys.noKeysFound')}</p></div>}
          </div>
        )}
      </div>

      {/* ── Create Key Modal ── */}
      <BaseModal
        show={showNewKeyModal}
        onClose={() => setShowNewKeyModal(false)}
        icon={<KeyIcon />}
        title={t('apikeys.modal.createTitle')}
        subtitle={t('apikeys.subtitle')}
        footer={
          <>
            <button className="bm-btn bm-btn--cancel" onClick={() => setShowNewKeyModal(false)}>{t('common.cancel')}</button>
            <button
              className="bm-btn bm-btn--primary"
              onClick={handleCreateKey}
              disabled={!newKeyData.name || newKeyData.permissions.length === 0}
            >
              {t('apikeys.modal.createTitle')}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label htmlFor="keyName">{t('apikeys.modal.keyName')}</label>
          <input type="text" id="keyName" placeholder={t('apikeys.modal.keyNamePlaceholder')} value={newKeyData.name} onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })} />
          <div className="field-hint">{t('apikeys.modal.keyNameHint')}</div>
        </div>
        <div className="form-group">
          <label htmlFor="keyExpiration">{t('apikeys.modal.expiration')}</label>
          <select id="keyExpiration" value={newKeyData.expiration} onChange={(e) => setNewKeyData({ ...newKeyData, expiration: e.target.value })}>
            <option value="never">{t('apikeys.modal.neverExpire')}</option>
            <option value="30days">{t('apikeys.modal.30days')}</option>
            <option value="90days">{t('apikeys.modal.90days')}</option>
            <option value="1year">{t('apikeys.modal.1year')}</option>
          </select>
          <div className="field-hint">{t('apikeys.modal.expirationHint')}</div>
        </div>
        <div className="form-group">
          <label>{t('apikeys.modal.permissions')}</label>
          <div className="checkbox-group">
            {[
              { id: 'permTime', value: 'time_estimation', labelKey: 'apikeys.modal.timeEstimation' },
              { id: 'permDist', value: 'distance_estimation', labelKey: 'apikeys.modal.distanceEstimation' },
              { id: 'permComb', value: 'combined_model', labelKey: 'apikeys.modal.combinedModel' },
            ].map(({ id, value, labelKey }) => (
              <div className="checkbox-item" key={id}>
                <input
                  type="checkbox"
                  id={id}
                  checked={newKeyData.permissions.includes(value)}
                  onChange={(e) => {
                    const perms = e.target.checked
                      ? [...newKeyData.permissions, value]
                      : newKeyData.permissions.filter(p => p !== value);
                    setNewKeyData({ ...newKeyData, permissions: perms });
                  }}
                />
                <label htmlFor={id}>{t(labelKey)}</label>
              </div>
            ))}
          </div>
        </div>
      </BaseModal>

      {/* ── Success Modal ── */}
      <BaseModal
        show={showNewKeySuccess}
        onClose={() => setShowNewKeySuccess(false)}
        icon={<SuccessKeyIcon />}
        title={t('apikeys.success.title')}
        subtitle={t('apikeys.success.message')}
        footer={
          <button className="bm-btn bm-btn--primary" onClick={() => setShowNewKeySuccess(false)}>
            {t('common.done')}
          </button>
        }
      >
        <div className="success-icon" style={{ textAlign: 'center', marginBottom: 16 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#34a853"/>
          </svg>
        </div>
        <div className="new-key-display">
          <p className="key-warning">{t('apikeys.success.warning')}</p>
          <div className="key-value-container">
            <code>{newKeyValue}</code>
            <button className="btn-copy" onClick={() => handleCopyValue(newKeyValue)}>
              <CopyIcon /> {t('common.copy')}
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default APIKeys;
