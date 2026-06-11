import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../../api';
import { TabProps } from '../types';

type Props = TabProps;

const DAYS = [
  { key: 'sunday',    labelKey: 'agency.settings.hours.days.sunday'    },
  { key: 'monday',    labelKey: 'agency.settings.hours.days.monday'    },
  { key: 'tuesday',   labelKey: 'agency.settings.hours.days.tuesday'   },
  { key: 'wednesday', labelKey: 'agency.settings.hours.days.wednesday' },
  { key: 'thursday',  labelKey: 'agency.settings.hours.days.thursday'  },
  { key: 'friday',    labelKey: 'agency.settings.hours.days.friday'    },
  { key: 'saturday',  labelKey: 'agency.settings.hours.days.saturday'  },
];

const defaultSchedule = () => ({
  sunday:    { isOpen: true,  open: '08:00', close: '22:00' },
  monday:    { isOpen: true,  open: '08:00', close: '22:00' },
  tuesday:   { isOpen: true,  open: '08:00', close: '22:00' },
  wednesday: { isOpen: true,  open: '08:00', close: '22:00' },
  thursday:  { isOpen: true,  open: '08:00', close: '22:00' },
  friday:    { isOpen: false, open: '',      close: ''       },
  saturday:  { isOpen: true,  open: '08:00', close: '22:00' },
});

const HoursTab: React.FC<Props> = ({ agency, onUpdate }) => {
  const { t } = useTranslation();
  const wh = agency.workingHours || {};
  const [is24_7, setIs24_7]     = useState<boolean>(wh.is24_7 || false);
  const [schedule, setSchedule] = useState<any>(wh.schedule || defaultSchedule());
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState('');

  const setDay = (day: string, field: string, value: any) => {
    setSchedule((prev: any) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/v1/agencies/me/settings/hours', { is24_7, schedule, holidays: wh.holidays || [] });
      onUpdate({ ...agency, workingHours: res.data.workingHours });
      setMessage(`success:${t('agency.settings.hours.successMsg')}`);
    } catch {
      setMessage(`error:${t('agency.settings.hours.errorMsg')}`);
    } finally {
      setSaving(false);
    }
  };

  const [msgType, msgText] = message.split(':');

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2>{t('agency.settings.hours.title')}</h2>
          <p>{t('agency.settings.hours.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {message && <div className={`message ${msgType}`}>{msgText}</div>}

        {/* 24/7 toggle */}
        <div className="is247-toggle">
          <label className="toggle-switch">
            <input type="checkbox" checked={is24_7} onChange={e => setIs24_7(e.target.checked)} />
            <span className="toggle-switch__track" />
            <span className="toggle-switch__thumb" />
          </label>
          {t('agency.settings.hours.toggle247')}
        </div>

        {/* Day schedule */}
        {!is24_7 && (
          <div className="form-section">
            <h3>{t('agency.settings.hours.weeklyTitle')}</h3>
            <div className="hours-grid">
              {DAYS.map(({ key, labelKey }) => {
                const day = schedule[key] || {};
                return (
                  <div key={key} className={`day-row ${!day.isOpen ? 'closed' : ''}`}>
                    <span className="day-row__name">{t(labelKey)}</span>

                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={day.isOpen || false}
                        onChange={e => setDay(key, 'isOpen', e.target.checked)}
                      />
                      <span className="toggle-switch__track" />
                      <span className="toggle-switch__thumb" />
                    </label>

                    <div className="day-row__times">
                      {day.isOpen ? (
                        <>
                          <input
                            type="time"
                            value={day.open || '08:00'}
                            onChange={e => setDay(key, 'open', e.target.value)}
                          />
                          <span>→</span>
                          <input
                            type="time"
                            value={day.close || '22:00'}
                            onChange={e => setDay(key, 'close', e.target.value)}
                          />
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{t('agency.settings.hours.closed')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('agency.settings.hours.saving') : t('agency.settings.hours.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HoursTab;
