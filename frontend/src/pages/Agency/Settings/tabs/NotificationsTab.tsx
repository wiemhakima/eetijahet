import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabProps } from '../types';

type Props = TabProps;

const NotificationsTab: React.FC<Props> = () => {
  const { t } = useTranslation();

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2>{t('agency.settings.notifications.title')}</h2>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        gap: 20,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>🔔</div>
        <p style={{ fontSize: 15, color: '#64748b', maxWidth: 380, margin: 0, lineHeight: 1.6 }}>
          {t('agency.settings.notifications.comingSoonMsg')}
        </p>
        <button
          disabled
          style={{
            padding: '10px 28px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#f1f5f9',
            color: '#94a3b8',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'not-allowed',
          }}
        >
          {t('agency.settings.notifications.comingSoonBtn')}
        </button>
      </div>
    </div>
  );
};

export default NotificationsTab;
