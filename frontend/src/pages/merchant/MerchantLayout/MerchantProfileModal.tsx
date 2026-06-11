import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../api';
import LocationPickerModal from '../../../components/LocationPickerModal';
import BaseModal from '../../../components/ui/BaseModal/BaseModal';

interface Props {
  onClose: () => void;
  onSaved: (newStoreName?: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', border: '1.5px solid #d1d5db',
  borderRadius: 8, fontSize: 14, outline: 'none', color: '#16191f',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#16191f', display: 'block', marginBottom: 5,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14,
};

const MerchantProfileModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm]       = useState({ storeName: '', firstName: '', lastName: '', email: '', phone: '' });
  const [lat, setLat]         = useState<number | null>(null);
  const [lng, setLng]         = useState<number | null>(null);
  const [city, setCity]       = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [logoData, setLogoData]       = useState('');
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [profileError, setProfileError]     = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [pwd, setPwd]               = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdSaving, setPwdSaving]   = useState(false);
  const [pwdError, setPwdError]     = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
    api.get('/v1/merchant/profile')
      .then(res => {
        const m = res.data?.data;
        if (m) {
          setForm({
            storeName: m.storeName       || '',
            firstName: m.user?.firstName || '',
            lastName:  m.user?.lastName  || '',
            email:     m.user?.email     || '',
            phone:     m.user?.phone     || '',
          });
          setLogoPreview(m.logo || '');
          setLogoData(m.logo || '');
          setLat(m.address?.lat  ?? null);
          setLng(m.address?.lng  ?? null);
          setCity(m.address?.city || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target?.result as string;
      setLogoData(b64);
      setLogoPreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const handlePickerConfirm = (pickedLat: number, pickedLng: number, address: string) => {
    setLat(pickedLat);
    setLng(pickedLng);
    const parsed = address.split(',')[1]?.trim() || address.split(',')[0]?.trim() || '';
    if (parsed) setCity(parsed);
    setPickerOpen(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await api.patch('/v1/merchant/profile', {
        storeName: form.storeName,
        logo:      logoData || undefined,
        firstName: form.firstName,
        lastName:  form.lastName,
        phone:     form.phone,
        city:      city     || undefined,
        lat:       lat      ?? undefined,
        lng:       lng      ?? undefined,
      });
      setProfileSuccess('Profil mis à jour avec succès.');
      onSaved(form.storeName);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setProfileError(msg || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwd.newPwd !== pwd.confirm) { setPwdError('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.newPwd.length < 8) { setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
    setPwdSaving(true);
    setPwdError('');
    setPwdSuccess('');
    try {
      await api.patch('/v1/merchant/change-password', {
        currentPassword: pwd.current,
        newPassword:     pwd.newPwd,
      });
      setPwdSuccess('Mot de passe changé avec succès.');
      setPwd({ current: '', newPwd: '', confirm: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setPwdError(msg || 'Erreur lors du changement de mot de passe.');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <>
      <BaseModal show title="✏️ Modifier le profil" onClose={onClose} maxWidth="560px">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
            Chargement...
          </div>
        ) : (
              <>
                {/* ── Section 1: Boutique ───────────────────────────── */}
                <div style={sectionTitleStyle}>Boutique</div>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 12,
                    background: '#f1f5f9', border: '1.5px solid #e2e8f0',
                    overflow: 'hidden', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 28 }}>🏪</span>}
                  </div>
                  <div>
                    <button
                      onClick={() => fileRef.current?.click()}
                      style={{ padding: '7px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}
                    >
                      Changer le logo
                    </button>
                    {logoPreview && (
                      <button
                        onClick={() => { setLogoData(''); setLogoPreview(''); }}
                        style={{ marginLeft: 8, padding: '7px 12px', border: 'none', background: 'none', fontSize: 12, color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                      >
                        Supprimer
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoFile} />
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>PNG, JPG — max 2 MB</div>
                  </div>
                </div>

                {/* Store name */}
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Nom de la boutique</label>
                  <input
                    type="text"
                    value={form.storeName}
                    onChange={e => setForm(p => ({ ...p, storeName: e.target.value }))}
                    style={inputStyle}
                    placeholder="Nom affiché dans l'application"
                  />
                </div>

                {/* Location GPS */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Localisation GPS</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => setPickerOpen(true)}
                      style={{ padding: '9px 16px', border: '1.5px solid #d1d5db', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#2563eb', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      📍 {lat && lng ? 'Modifier la localisation' : 'Choisir sur la carte'}
                    </button>
                    {lat && lng && (
                      <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                        {lat.toFixed(5)}, {lng.toFixed(5)}
                      </span>
                    )}
                  </div>
                  {city && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                      📌 {city}
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 20px' }} />

                {/* ── Section 2: Personnel ──────────────────────────── */}
                <div style={sectionTitleStyle}>Informations personnelles</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Prénom</label>
                    <input type="text" value={form.firstName} style={inputStyle}
                      onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Nom</label>
                    <input type="text" value={form.lastName} style={inputStyle}
                      onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ ...labelStyle, color: '#94a3b8' }}>Email (non modifiable)</label>
                  <input type="email" value={form.email} readOnly
                    style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8', border: '1.5px solid #e2e8f0' }} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="tel" value={form.phone} style={inputStyle} placeholder="+965 XXXX XXXX"
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>

                {profileError   && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>{profileError}</div>}
                {profileSuccess && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontSize: 13, marginBottom: 12 }}>{profileSuccess}</div>}

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{ width: '100%', padding: '10px 0', background: saving ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 28 }}
                >
                  {saving ? 'Enregistrement...' : '✓ Enregistrer le profil'}
                </button>

                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 20px' }} />

                {/* ── Section 3: Mot de passe ───────────────────────── */}
                <div style={sectionTitleStyle}>Changer le mot de passe</div>

                {([
                  { key: 'current', label: 'Mot de passe actuel',               placeholder: 'Votre mot de passe actuel' },
                  { key: 'newPwd',  label: 'Nouveau mot de passe',              placeholder: 'Au moins 8 caractères' },
                  { key: 'confirm', label: 'Confirmer le nouveau mot de passe', placeholder: 'Répétez le nouveau mot de passe' },
                ] as { key: keyof typeof pwd; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type="password"
                      value={pwd[key]}
                      onChange={e => setPwd(p => ({ ...p, [key]: e.target.value }))}
                      style={inputStyle}
                      placeholder={placeholder}
                    />
                  </div>
                ))}

                {pwdError   && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>{pwdError}</div>}
                {pwdSuccess && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontSize: 13, marginBottom: 12 }}>{pwdSuccess}</div>}

                <button
                  onClick={handleChangePassword}
                  disabled={pwdSaving || !pwd.current || !pwd.newPwd || !pwd.confirm}
                  style={{
                    width: '100%', padding: '10px 0', border: 'none', borderRadius: 9,
                    fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                    background: (pwdSaving || !pwd.current || !pwd.newPwd || !pwd.confirm) ? '#c4b5fd' : '#7c3aed',
                    color: '#fff',
                  }}
                >
                  {pwdSaving ? 'Changement...' : '🔒 Changer le mot de passe'}
                </button>
              </>
        )}
      </BaseModal>

      {pickerOpen && createPortal(
        <LocationPickerModal
          isOpen
          onClose={() => setPickerOpen(false)}
          onConfirm={handlePickerConfirm}
          initialLat={lat ?? undefined}
          initialLng={lng ?? undefined}
        />,
        document.body,
      )}
    </>
  );
};

export default MerchantProfileModal;
