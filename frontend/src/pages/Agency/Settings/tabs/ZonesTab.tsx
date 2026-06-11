import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../../api';
import { TabProps } from '../types';

type Props = TabProps;

const GOVERNORATES = [
  'Al Asimah', 'Hawalli', 'Al Farwaniyah', 'Al Ahmadi', 'Al Jahra', 'Mubarak Al-Kabeer',
];

interface Zone {
  _id?: string;
  name: string;
  governorate: string;
  isActive: boolean;
  pricing: { basePrice: number; pricePerKm: number; minimumFee: number; expressFee: number };
}

const emptyZone = (): Zone => ({
  name: '',
  governorate: '',
  isActive: true,
  pricing: { basePrice: 1, pricePerKm: 0.250, minimumFee: 1, expressFee: 0.500 },
});

const ZonesTab: React.FC<Props> = ({ agency, onUpdate }) => {
  const { t } = useTranslation();
  const [zones, setZones] = useState<Zone[]>(agency.deliveryZones || []);
  const [defaultPricing, setDefaultPricing] = useState(
    agency.defaultPricing || { basePrice: 1, pricePerKm: 0.300, minimumFee: 1, expressFee: 0.500 }
  );
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState('');

  const updateZone = (index: number, field: string, value: any) => {
    setZones(prev => prev.map((z, i) => {
      if (i !== index) return z;
      if (field.startsWith('pricing.')) {
        const key = field.split('.')[1];
        return { ...z, pricing: { ...z.pricing, [key]: parseFloat(value) || 0 } };
      }
      return { ...z, [field]: value };
    }));
  };

  const addZone = () => setZones(prev => [...prev, emptyZone()]);

  const removeZone = (index: number) => setZones(prev => prev.filter((_, i) => i !== index));

  const updateDefault = (field: string, value: string) => {
    setDefaultPricing((prev: any) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/v1/agencies/me/settings/zones', { deliveryZones: zones, defaultPricing });
      onUpdate({ ...agency, deliveryZones: res.data.deliveryZones, defaultPricing: res.data.defaultPricing });
      setMessage(`success:${t('agency.settings.zones.successMsg')}`);
    } catch {
      setMessage(`error:${t('agency.settings.zones.errorMsg')}`);
    } finally {
      setSaving(false);
    }
  };

  const [msgType, msgText] = message.split(':');

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2>{t('agency.settings.zones.title')}</h2>
          <p>{t('agency.settings.zones.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {message && <div className={`message ${msgType}`}>{msgText}</div>}

        <div className="form-section">
          <h3>{t('agency.settings.zones.sectionTitle')} ({zones.length})</h3>

          <div className="zones-list">
            {zones.map((zone, i) => (
              <div key={i} className="zone-card">
                <div className="zone-card__header">
                  <div>
                    <div className="zone-card__name">{zone.name || `${t('agency.settings.zones.zoneDefault')} ${i + 1}`}</div>
                    <div className="zone-card__gov">{zone.governorate}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={zone.isActive}
                        onChange={e => updateZone(i, 'isActive', e.target.checked)}
                      />
                      {t('agency.settings.zones.active')}
                    </label>
                    <button type="button" className="btn-danger" onClick={() => removeZone(i)}>🗑️</button>
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: 12 }}>
                  <div className="form-group">
                    <label>{t('agency.settings.zones.zoneName')}</label>
                    <input type="text" value={zone.name} onChange={e => updateZone(i, 'name', e.target.value)} placeholder="ex: Salmiya" />
                  </div>
                  <div className="form-group">
                    <label>{t('agency.settings.zones.governorate')}</label>
                    <select value={zone.governorate} onChange={e => updateZone(i, 'governorate', e.target.value)}>
                      <option value="">{t('agency.settings.zones.selectGovernorate')}</option>
                      {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="zone-pricing">
                  {[
                    { key: 'basePrice',  labelKey: 'agency.settings.zones.labelBasePrice' },
                    { key: 'pricePerKm', labelKey: 'agency.settings.zones.labelPricePerKm' },
                    { key: 'minimumFee', labelKey: 'agency.settings.zones.labelMinFee' },
                    { key: 'expressFee', labelKey: 'agency.settings.zones.labelExpress' },
                  ].map(({ key, labelKey }) => (
                    <div key={key} className="price-field">
                      <label>{t(labelKey)}</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={(zone.pricing as any)[key]}
                        onChange={e => updateZone(i, `pricing.${key}`, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="add-zone-btn" onClick={addZone}>
            {t('agency.settings.zones.addZone')}
          </button>
        </div>

        {/* Default pricing */}
        <div className="default-pricing-box">
          <h3>{t('agency.settings.zones.defaultPricingTitle')}</h3>
          <div className="zone-pricing">
            {[
              { key: 'basePrice',  labelKey: 'agency.settings.zones.labelBasePrice' },
              { key: 'pricePerKm', labelKey: 'agency.settings.zones.labelPricePerKm' },
              { key: 'minimumFee', labelKey: 'agency.settings.zones.labelMinFee' },
              { key: 'expressFee', labelKey: 'agency.settings.zones.labelExpress' },
            ].map(({ key, labelKey }) => (
              <div key={key} className="price-field">
                <label>{t(labelKey)}</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={(defaultPricing as any)[key]}
                  onChange={e => updateDefault(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('agency.settings.zones.saving') : t('agency.settings.zones.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ZonesTab;
