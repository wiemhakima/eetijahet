import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../../api';
import { TabProps } from '../types';

type Props = TabProps;

const GOVERNORATES = [
  { value: 'capital',   label: 'Al Asimah (Capital)' },
  { value: 'hawalli',   label: 'Hawalli' },
  { value: 'farwaniya', label: 'Al Farwaniyah' },
  { value: 'ahmadi',    label: 'Al Ahmadi' },
  { value: 'jahra',     label: 'Al Jahra' },
  { value: 'mubarak',   label: 'Mubarak Al-Kabeer' },
];

const ProfileTab: React.FC<Props> = ({ agency, onUpdate }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name:        agency.profile?.name        || agency.name  || '',
    logo:        agency.profile?.logo        || agency.logo  || '',
    description: agency.profile?.description || '',
    phone:       agency.profile?.phone       || agency.phone || '',
    email:       agency.profile?.email       || agency.email || '',
    website:     agency.profile?.website     || '',
    address: {
      street:      agency.profile?.address?.street      || '',
      city:        agency.profile?.address?.city        || '',
      governorate: agency.profile?.address?.governorate || '',
    },
    socialMedia: {
      instagram: agency.profile?.socialMedia?.instagram || '',
      twitter:   agency.profile?.socialMedia?.twitter   || '',
      facebook:  agency.profile?.socialMedia?.facebook  || '',
    },
  });
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState('');

  const set = (field: string, value: any) => {
    setForm(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return { ...prev, [parent]: { ...(prev as any)[parent], [child]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/v1/agencies/me/settings/profile', form);
      onUpdate(res.data.agency);
      setMessage(`success:${t('agency.settings.profile.successMsg')}`);
    } catch {
      setMessage(`error:${t('agency.settings.profile.errorMsg')}`);
    } finally {
      setSaving(false);
    }
  };

  const [msgType, msgText] = message.split(':');

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2>{t('agency.settings.profile.title')}</h2>
          <p>{t('agency.settings.profile.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {message && <div className={`message ${msgType}`}>{msgText}</div>}

        {/* Logo */}
        <div className="form-section">
          <h3>{t('agency.settings.profile.sectionLogo')}</h3>
          <div className="logo-upload">
            <div className="logo-preview">
              {form.logo
                ? <img src={form.logo} alt="Logo" />
                : <span className="placeholder">🏢</span>
              }
            </div>
            <div className="logo-input form-group">
              <label>{t('agency.settings.profile.logoUrl')}</label>
              <input
                type="url"
                value={form.logo}
                onChange={e => set('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="form-section">
          <h3>{t('agency.settings.profile.sectionInfo')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('agency.settings.profile.agencyName')}</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>{t('agency.settings.profile.email')}</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('agency.settings.profile.phone')}</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+965 xxxx xxxx" />
            </div>
            <div className="form-group">
              <label>{t('agency.settings.profile.website')}</label>
              <input type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://www.example.com" />
            </div>
          </div>
          <div className="form-group full">
            <label>{t('agency.settings.profile.description')}</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder={t('agency.settings.profile.descriptionPlaceholder')}
            />
          </div>
        </div>

        {/* Address */}
        <div className="form-section">
          <h3>{t('agency.settings.profile.sectionAddress')}</h3>
          <div className="form-grid">
            <div className="form-group full">
              <label>{t('agency.settings.profile.street')}</label>
              <input type="text" value={form.address.street} onChange={e => set('address.street', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('agency.settings.profile.city')}</label>
              <input type="text" value={form.address.city} onChange={e => set('address.city', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('agency.settings.profile.governorate')}</label>
              <select value={form.address.governorate} onChange={e => set('address.governorate', e.target.value)}>
                <option value="">{t('agency.settings.profile.selectGovernorate')}</option>
                {GOVERNORATES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="form-section">
          <h3>{t('agency.settings.profile.sectionSocial')}</h3>
          <div className="form-grid three">
            <div className="form-group">
              <label>📸 Instagram</label>
              <input type="text" value={form.socialMedia.instagram} onChange={e => set('socialMedia.instagram', e.target.value)} placeholder="@compte" />
            </div>
            <div className="form-group">
              <label>🐦 Twitter</label>
              <input type="text" value={form.socialMedia.twitter} onChange={e => set('socialMedia.twitter', e.target.value)} placeholder="@compte" />
            </div>
            <div className="form-group">
              <label>📘 Facebook</label>
              <input type="text" value={form.socialMedia.facebook} onChange={e => set('socialMedia.facebook', e.target.value)} placeholder="votre.page" />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('agency.settings.profile.saving') : t('agency.settings.profile.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileTab;
