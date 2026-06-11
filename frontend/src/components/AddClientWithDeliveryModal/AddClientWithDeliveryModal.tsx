import React, { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import {
  createClientWithDelivery,
  fetchClients,
  fetchDeliveries,
  type TestModeCredentials,
} from '../../store/slices/agencySlice';
import BaseModal from '../ui/BaseModal/BaseModal';
import './AddClientWithDeliveryModal.scss';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  firstName:    string;
  lastName:     string;
  email:        string;
  phone:        string;
  pickupAddress:  string;
  pickupLat:      string;
  pickupLng:      string;
  dropoffAddress: string;
  dropoffLat:     string;
  dropoffLng:     string;
  packageType:  string;
  estimatedPrice: string;
  notes:        string;
  sendWhatsapp: boolean;
}

const EMPTY: FormState = {
  firstName: '', lastName: '', email: '', phone: '',
  pickupAddress: '', pickupLat: '', pickupLng: '',
  dropoffAddress: '', dropoffLat: '', dropoffLng: '',
  packageType: 'small', estimatedPrice: '', notes: '',
  sendWhatsapp: true,
};

const PKG_OPTIONS = [
  { value: 'document', label: 'Document' },
  { value: 'small',    label: 'Small' },
  { value: 'medium',   label: 'Medium' },
  { value: 'large',    label: 'Large' },
  { value: 'fragile',  label: 'Fragile' },
  { value: 'food',     label: 'Food' },
];

const COORD_HINT = 'e.g. Tunis 36.8324 / 10.2359';

// ─── Icons ────────────────────────────────────────────────────────────────────

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const DeliveryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

// ─── Test Mode Success Modal ──────────────────────────────────────────────────

interface TestModalProps {
  creds: TestModeCredentials;
  onClose: () => void;
}

const TestModeModal: React.FC<TestModalProps> = ({ creds, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    const text =
      `Email: ${creds.clientEmail}\n` +
      `Password: ${creds.clientPassword}\n` +
      `Tracking: ${creds.trackingUrl}\n` +
      `Login: ${creds.loginUrl}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <BaseModal
      show={true}
      onClose={onClose}
      icon={<CheckIcon />}
      title="Delivery Created!"
      subtitle="Delivery created successfully."
      maxWidth="480px"
      footer={
        <button className="bm-btn bm-btn--primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
          Done
        </button>
      }
    >
      <div style={{
        background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#92400e' }}>TEST MODE — Client Credentials</span>
        </div>
        <p style={{ fontSize: 12, color: '#78350f', marginBottom: 12 }}>
          WhatsApp may not be configured. Share these credentials with the client manually.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Email',    value: creds.clientEmail },
            { label: 'Password', value: creds.clientPassword },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', width: 68, flexShrink: 0 }}>{label}:</span>
              <code style={{
                flex: 1, fontSize: 13, fontWeight: 600, color: '#0f172a',
                background: '#fff', padding: '4px 10px', borderRadius: 6,
                border: '1px solid #fde68a', wordBreak: 'break-all',
              }}>{value}</code>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', width: 68, flexShrink: 0 }}>Tracking:</span>
            <a
              href={creds.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#1d4ed8', wordBreak: 'break-all' }}
            >
              {creds.trackingUrl}
            </a>
          </div>
        </div>

        <button
          onClick={copyAll}
          style={{
            marginTop: 14, display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', background: copied ? '#16a34a' : '#0f172a',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
          }}
        >
          <CopyIcon />
          {copied ? 'Copied!' : 'Copy All'}
        </button>
      </div>
    </BaseModal>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

const AddClientWithDeliveryModal: React.FC<Props> = ({ onClose }) => {
  const dispatch = useAppDispatch();

  const [form,       setForm]       = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');
  const [testCreds,  setTestCreds]  = useState<TestModeCredentials | null>(null);

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.firstName.trim())      { setFormError('First name is required.'); return; }
    if (!form.email.trim())          { setFormError('Email is required.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { setFormError('Enter a valid email address.'); return; }
    if (!form.phone.trim())          { setFormError('Phone number is required.'); return; }
    if (!form.pickupAddress.trim())  { setFormError('Pickup address is required.'); return; }
    if (!form.dropoffAddress.trim()) { setFormError('Delivery address is required.'); return; }

    setSubmitting(true);
    try {
      const result = await dispatch(createClientWithDelivery({
        firstName:      form.firstName.trim(),
        lastName:       form.lastName.trim(),
        email:          form.email.trim(),
        phone:          form.phone.trim(),
        pickupAddress:  form.pickupAddress.trim(),
        pickupLat:      form.pickupLat  ? parseFloat(form.pickupLat)  : undefined,
        pickupLng:      form.pickupLng  ? parseFloat(form.pickupLng)  : undefined,
        dropoffAddress: form.dropoffAddress.trim(),
        dropoffLat:     form.dropoffLat ? parseFloat(form.dropoffLat) : undefined,
        dropoffLng:     form.dropoffLng ? parseFloat(form.dropoffLng) : undefined,
        packageType:    form.packageType,
        estimatedPrice: form.estimatedPrice ? parseFloat(form.estimatedPrice) : undefined,
        notes:          form.notes.trim(),
        sendWhatsapp:   form.sendWhatsapp,
      })).unwrap();

      dispatch(fetchClients());
      dispatch(fetchDeliveries({}));

      if (result.testMode) {
        setTestCreds(result.testMode);
      } else {
        setTimeout(() => onClose(), 1200);
      }
      setSubmitting(false);
    } catch (err) {
      setFormError(typeof err === 'string' ? err : 'Failed to create client & delivery.');
      setSubmitting(false);
    }
  };

  if (testCreds) {
    return <TestModeModal creds={testCreds} onClose={onClose} />;
  }

  return (
    <BaseModal
      show={true}
      onClose={onClose}
      icon={<DeliveryIcon />}
      title="New Client & Delivery"
      subtitle="Create a client account and delivery in one step"
      maxWidth="560px"
    >
      {formError && <div className="acwd-alert acwd-alert--error" style={{ marginBottom: 16 }}>{formError}</div>}

      <form onSubmit={handleSubmit} className="acwd-form">
        {/* ── Section 1: Client ── */}
        <div className="acwd-section acwd-section--client">
          <div className="acwd-section__label">
            <span className="acwd-section__badge acwd-section__badge--green">1</span>
            Client Information
          </div>
          <div className="acwd-grid-2">
            <div className="acwd-field">
              <label className="acwd-label">First Name *</label>
              <input className="acwd-input" value={form.firstName} autoFocus onChange={e => set('firstName', e.target.value)} placeholder="Sami" />
            </div>
            <div className="acwd-field">
              <label className="acwd-label">Last Name</label>
              <input className="acwd-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Ben Ali" />
            </div>
          </div>
          <div className="acwd-field">
            <label className="acwd-label">Email *</label>
            <input className="acwd-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="client@email.com" />
          </div>
          <div className="acwd-field">
            <label className="acwd-label">Phone *</label>
            <div className="acwd-phone-row">
              <span className="acwd-phone-prefix">+965</span>
              <input className="acwd-input acwd-input--phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="xx xxx xxx" />
            </div>
          </div>
        </div>

        {/* ── Section 2: Delivery ── */}
        <div className="acwd-section acwd-section--delivery">
          <div className="acwd-section__label">
            <span className="acwd-section__badge acwd-section__badge--blue">2</span>
            Delivery Details
          </div>

          <div className="acwd-field">
            <label className="acwd-label">Pickup Address *</label>
            <input className="acwd-input" value={form.pickupAddress} onChange={e => set('pickupAddress', e.target.value)} placeholder="Street, City" />
          </div>
          <div className="acwd-grid-2">
            <div className="acwd-field">
              <label className="acwd-label">Pickup Lat <span className="acwd-label-opt">(optional)</span></label>
              <input className="acwd-input" type="number" step="any" value={form.pickupLat} onChange={e => set('pickupLat', e.target.value)} placeholder={COORD_HINT.split('/')[0].trim()} />
            </div>
            <div className="acwd-field">
              <label className="acwd-label">Pickup Lng <span className="acwd-label-opt">(optional)</span></label>
              <input className="acwd-input" type="number" step="any" value={form.pickupLng} onChange={e => set('pickupLng', e.target.value)} placeholder={COORD_HINT.split('/')[1].trim()} />
            </div>
          </div>

          <div className="acwd-field">
            <label className="acwd-label">Delivery Address *</label>
            <input className="acwd-input" value={form.dropoffAddress} onChange={e => set('dropoffAddress', e.target.value)} placeholder="Street, City" />
          </div>
          <div className="acwd-grid-2">
            <div className="acwd-field">
              <label className="acwd-label">Delivery Lat <span className="acwd-label-opt">(optional)</span></label>
              <input className="acwd-input" type="number" step="any" value={form.dropoffLat} onChange={e => set('dropoffLat', e.target.value)} placeholder="e.g. 34.7406" />
            </div>
            <div className="acwd-field">
              <label className="acwd-label">Delivery Lng <span className="acwd-label-opt">(optional)</span></label>
              <input className="acwd-input" type="number" step="any" value={form.dropoffLng} onChange={e => set('dropoffLng', e.target.value)} placeholder="e.g. 10.7603" />
            </div>
          </div>

          <div className="acwd-grid-2">
            <div className="acwd-field">
              <label className="acwd-label">Package Type</label>
              <select className="acwd-input" value={form.packageType} onChange={e => set('packageType', e.target.value)}>
                {PKG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="acwd-field">
              <label className="acwd-label">Price (KWD)</label>
              <input className="acwd-input" type="number" min="0" step="0.100" value={form.estimatedPrice} onChange={e => set('estimatedPrice', e.target.value)} placeholder="0.000" />
            </div>
          </div>
          <div className="acwd-field">
            <label className="acwd-label">Notes</label>
            <textarea className="acwd-input acwd-input--textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Fragile, call before delivery…" rows={2} />
          </div>
          <div className="acwd-coords-hint">
            📍 Test coords (Tunisia): Tunis 36.8324 / 10.2359 · Sfax 34.7406 / 10.7603 · Sousse 35.8288 / 10.5972
          </div>
        </div>

        {/* ── Section 3: WhatsApp ── */}
        <div className="acwd-section acwd-section--whatsapp">
          <div className="acwd-whatsapp-row">
            <input id="sendWhatsapp" type="checkbox" checked={form.sendWhatsapp} onChange={e => set('sendWhatsapp', e.target.checked)} className="acwd-checkbox" />
            <label htmlFor="sendWhatsapp" className="acwd-whatsapp-label">Send login credentials via WhatsApp</label>
          </div>
          {form.sendWhatsapp && (
            <div className="acwd-whatsapp-info">
              New clients receive: email + auto-generated password + tracking link.<br />
              Existing clients receive: tracking link only.
              Credentials are also shown here if WhatsApp is not configured.
            </div>
          )}
        </div>

        {/* ── Footer (inside form for submit) ── */}
        <div className="acwd-footer">
          <button type="button" className="bm-btn bm-btn--cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="bm-btn bm-btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Client & Delivery'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default AddClientWithDeliveryModal;
