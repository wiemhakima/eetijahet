import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApiKeyController } from '../../../controllers/useApiKeyController';
import { API_SERVICES, ApiService } from '../servicesData';
import { getServiceIcon, EyeIcon, CheckCircleIcon, CopyIcon, CheckIcon, CloseIcon } from '../ServiceIcons';
import './CreateAPI.scss';

const CreateAPI: React.FC = () => {
  const { t } = useTranslation();
  const ctrl = useApiKeyController();
  const navigate = useNavigate();
  const location = useLocation();
  const { newKey, isLoading } = ctrl;

  const isServicesStep = location.pathname.includes('/services');

  const locState = location.state as { apiName?: string; selectedServices?: string[] } | null;
  const [apiName, setApiName] = useState(() => locState?.apiName || '');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(() => {
    const saved = locState?.selectedServices;
    return saved ? new Set<string>(saved) : new Set<string>();
  });
  const [activeCategory, setActiveCategory] = useState<'all' | 'Estimation' | 'Routing'>('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (newKey) {
      setNewKeyValue(newKey.key);
      setShowSuccess(true);
      ctrl.clearNewKey();
    }
  }, [newKey]);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const filteredServices = activeCategory === 'all'
    ? API_SERVICES
    : API_SERVICES.filter(s => s.category === activeCategory);

  const selectedPermissions = API_SERVICES
    .filter(s => selectedServices.has(s.id))
    .map(s => s.permission)
    .filter((value, index, self) => self.indexOf(value) === index);

  const handleGoToServices = () => {
    if (!apiName.trim()) return;
    navigate('/dashboard/api-keys/create/services', {
      state: { apiName: apiName.trim(), selectedServices: Array.from(selectedServices) }
    });
  };

  const handleGoBackToName = () => {
    navigate('/dashboard/api-keys/create', {
      state: { apiName, selectedServices: Array.from(selectedServices) }
    });
  };

  const handleCreate = async () => {
    if (!apiName.trim() || selectedServices.size === 0) return;
    try {
      await ctrl.create({
        name: apiName.trim(),
        permissions: selectedPermissions
      });
    } catch (err) {
      console.error('Failed to create API key:', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newKeyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    setShowSuccess(false);
    navigate('/dashboard/api-keys');
  };

  return (
    <div className="aws-create">
      {/* Breadcrumb */}
      <div className="aws-breadcrumb">
        <button className="aws-breadcrumb-link" onClick={() => navigate('/dashboard/api-keys')}>
          {t('sidebar.apiKeys')}
        </button>
        <span className="aws-breadcrumb-sep">/</span>
        {!isServicesStep ? (
          <span className="aws-breadcrumb-current">{t('createApiKey.title')}</span>
        ) : (
          <>
            <button className="aws-breadcrumb-link" onClick={handleGoBackToName}>
              {t('createApiKey.title')}
            </button>
            <span className="aws-breadcrumb-sep">/</span>
            <span className="aws-breadcrumb-current">{t('createApiKey.selectServicesTitle')}</span>
          </>
        )}
      </div>

      {/* Page Header */}
      <div className="aws-create-header">
        <h1>{isServicesStep ? t('createApiKey.selectServicesTitle') : t('createApiKey.title')}</h1>
        <p>
          {isServicesStep
            ? t('createApiKey.selectServicesSubtitle')
            : t('createApiKey.subtitle')
          }
        </p>
      </div>

      {/* Step Indicator */}
      <div className="aws-steps">
        <div className={`aws-step ${!isServicesStep ? 'active' : 'completed'}`}>
          <span className="aws-step-number">{isServicesStep ? '✓' : '1'}</span>
          <span className="aws-step-label">{t('createApiKey.stepNameLabel')}</span>
        </div>
        <div className="aws-step-line" />
        <div className={`aws-step ${isServicesStep ? 'active' : ''}`}>
          <span className="aws-step-number">2</span>
          <span className="aws-step-label">{t('createApiKey.stepServicesLabel')}</span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!isServicesStep ? (
          <motion.div
            key="step-name"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Step 1: Name */}
            <div className="aws-card">
              <div className="aws-card-header">
                <h2>{t('createApiKey.cardTitle')}</h2>
              </div>
              <div className="aws-card-body">
                <div className="aws-form-group">
                  <label htmlFor="apiName">{t('createApiKey.nameLabel')}</label>
                  <input
                    id="apiName"
                    type="text"
                    placeholder={t('createApiKey.namePlaceholder')}
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    autoFocus
                    className="aws-input"
                  />
                  <span className="aws-form-hint">
                    {t('createApiKey.nameHint')}
                  </span>
                </div>

                <div className="aws-suggestions">
                  <span className="aws-suggestions-label">{t('createApiKey.suggestions')}</span>
                  <div className="aws-suggestion-chips">
                    {([
                      { value: 'Production API',  labelKey: 'createApiKey.chips.production' },
                      { value: 'Development API', labelKey: 'createApiKey.chips.development' },
                      { value: 'Testing API',     labelKey: 'createApiKey.chips.testing' },
                      { value: 'Mobile App API',  labelKey: 'createApiKey.chips.mobile' },
                      { value: 'Backend Service', labelKey: 'createApiKey.chips.backend' },
                    ] as const).map(({ value, labelKey }) => (
                      <button
                        key={value}
                        className={`aws-chip ${apiName === value ? 'active' : ''}`}
                        onClick={() => setApiName(value)}
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="aws-form-actions">
              <button
                className="aws-btn aws-btn-outline"
                onClick={() => navigate('/dashboard/api-keys')}
              >
                {t('common.cancel')}
              </button>
              <button
                className="aws-btn aws-btn-primary"
                onClick={handleGoToServices}
                disabled={!apiName.trim()}
              >
                {t('createApiKey.nextBtn')}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step-services"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Key name display */}
            <div className="aws-key-name-bar">
              <span className="aws-key-name-label">{t('createApiKey.keyNameLabel')}</span>
              <strong>{apiName}</strong>
              <button className="aws-btn-text" onClick={handleGoBackToName}>
                {t('createApiKey.editBtn')}
              </button>
            </div>

            {/* Category Filter */}
            <div className="aws-category-filter">
              {(['all', 'Estimation', 'Routing'] as const).map(cat => (
                <button
                  key={cat}
                  className={`aws-category-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? t('createApiKey.allServices') : t(`createApiKey.categories.${cat}`)}
                  <span className="aws-category-count">
                    {cat === 'all' ? API_SERVICES.length : API_SERVICES.filter(s => s.category === cat).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Service Cards Grid */}
            <div className="aws-services-grid">
              {filteredServices.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedServices.has(service.id)}
                  onToggle={() => toggleService(service.id)}
                  onView={() => navigate(`/dashboard/api-keys/service/${service.slug}`)}
                  index={index}
                />
              ))}
            </div>

            {/* Summary & Actions */}
            <div className="aws-summary-bar">
              <div className="aws-summary-left">
                <span className="aws-summary-count">
                  {t('createApiKey.servicesSelected', { count: selectedServices.size })}
                </span>
                {selectedServices.size > 0 && (
                  <div className="aws-selected-tags">
                    {API_SERVICES.filter(s => selectedServices.has(s.id)).map(s => (
                      <span key={s.id} className="aws-selected-tag">
                        {t(`createApiKey.services.${s.id}.name`)}
                        <button onClick={() => toggleService(s.id)} className="aws-tag-remove">
                          <CloseIcon />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="aws-summary-actions">
                <button className="aws-btn aws-btn-outline" onClick={handleGoBackToName}>
                  {t('common.back')}
                </button>
                <button
                  className="aws-btn aws-btn-primary"
                  onClick={handleCreate}
                  disabled={selectedServices.size === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="aws-spinner" />
                      {t('createApiKey.creating')}
                    </>
                  ) : (
                    t('createApiKey.title')
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="aws-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="aws-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <div className="aws-modal-header">
                <div className="aws-modal-icon success">
                  <CheckCircleIcon />
                </div>
                <h2>{t('apikeys.success.title')}</h2>
                <p>
                  {t('createApiKey.successMsg')} <strong>{apiName}</strong> {t('createApiKey.successMsgSuffix')}
                </p>
              </div>

              <div className="aws-modal-body">
                <div className="aws-modal-warning">
                  {t('createApiKey.successWarning')}
                </div>
                <div className="aws-key-display">
                  <code>{newKeyValue}</code>
                  <button className={`aws-btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                    {copied
                      ? <><CheckIcon /> {t('createApiKey.copiedBtn')}</>
                      : <><CopyIcon /> {t('common.copy')}</>
                    }
                  </button>
                </div>
              </div>

              <div className="aws-modal-footer">
                <button className="aws-btn aws-btn-primary" onClick={handleDone}>
                  {t('createApiKey.doneBtn')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Service Card Component
interface ServiceCardProps {
  service: ApiService;
  isSelected: boolean;
  onToggle: () => void;
  onView: () => void;
  index: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, isSelected, onToggle, onView, index }) => {
  const { t } = useTranslation();
  const IconComponent = getServiceIcon(service.id);

  return (
    <motion.div
      className={`aws-service-card ${isSelected ? 'selected' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      <div className="aws-scard-body">
        <div className="aws-scard-top">
          <div className="aws-scard-icon" style={{ color: service.color }}>
            <IconComponent />
          </div>
          {isSelected && (
            <motion.div
              className="aws-scard-check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <CheckCircleIcon />
            </motion.div>
          )}
        </div>

        <h3 className="aws-scard-title">{t(`createApiKey.services.${service.id}.name`)}</h3>
        <span className="aws-scard-category">{t(`createApiKey.categories.${service.category}`)}</span>
        <p className="aws-scard-summary">{t(`createApiKey.services.${service.id}.summary`)}</p>

        <div className="aws-scard-endpoint">
          <span className="aws-scard-method">{service.method}</span>
          <code>/{service.endpoint}</code>
        </div>

        <div className="aws-scard-meta">
          <span>{service.latency} {t('createApiKey.latency')}</span>
        </div>
      </div>

      <div className="aws-scard-actions">
        <button
          className="aws-scard-btn view"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          <EyeIcon />
          {t('createApiKey.viewBtn')}
        </button>
        <button
          className={`aws-scard-btn include ${isSelected ? 'included' : ''}`}
          onClick={onToggle}
        >
          {isSelected ? (
            <>
              <CheckCircleIcon />
              {t('createApiKey.includedBtn')}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 4C11.4477 4 11 4.44772 11 5V11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H11V19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19V13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H13V5C13 4.44772 12.5523 4 12 4Z" fill="currentColor"/>
              </svg>
              {t('createApiKey.includeBtn')}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default CreateAPI;
