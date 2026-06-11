import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPublicAgencies, PublicAgency } from '../../store/slices/agencySlice';
import api from '../../api';

// ─── Kuwait zones ─────────────────────────────────────────────────────────────
const KUWAIT_ZONES = [
  'Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra',
  'Ahmadi', 'Mubarak Al-Kabeer', 'Sabah Al-Salem', 'Fintas',
  'Mangaf', 'Mahboula', 'Fahaheel', 'Rumaithiya', 'Mishref', 'Salwa',
];

const PACKAGE_TYPES = [
  { value: 'document', label: 'Document / وثيقة' },
  { value: 'small',    label: 'Small parcel / طرد صغير' },
  { value: 'medium',   label: 'Medium parcel / طرد متوسط' },
  { value: 'large',    label: 'Large parcel / طرد كبير' },
  { value: 'fragile',  label: 'Fragile / هش' },
  { value: 'food',     label: 'Food / طعام' },
];

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepBar: React.FC<{ step: number }> = ({ step }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
    {[
      { n: 1, label: 'Choose Agency / اختر الشركة' },
      { n: 2, label: 'Delivery Details / تفاصيل' },
      { n: 3, label: 'Confirm / تأكيد' },
    ].map((s, i) => (
      <React.Fragment key={s.n}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15,
            background: step >= s.n ? '#1a73e8' : '#e2e8f0',
            color: step >= s.n ? '#fff' : '#94a3b8',
            transition: 'all .2s',
          }}>{s.n}</div>
          <span style={{ fontSize: 11, color: step >= s.n ? '#1a73e8' : '#94a3b8', fontWeight: step >= s.n ? 600 : 400, whiteSpace: 'nowrap' }}>
            {s.label}
          </span>
        </div>
        {i < 2 && (
          <div style={{ flex: 1, height: 2, background: step > s.n ? '#1a73e8' : '#e2e8f0', margin: '0 4px 20px', transition: 'all .2s' }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Agency card ──────────────────────────────────────────────────────────────
const AgencyCard: React.FC<{ agency: PublicAgency; selected: boolean; onClick: () => void }> = ({ agency, selected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      border: `2px solid ${selected ? '#1a73e8' : '#e2e8f0'}`,
      borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
      background: selected ? 'rgba(26,115,232,.04)' : '#fff',
      transition: 'all .18s',
      display: 'flex', alignItems: 'center', gap: 16,
    }}
  >
    {agency.logo ? (
      <img src={agency.logo} alt={agency.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
    ) : (
      <div style={{
        width: 52, height: 52, borderRadius: 10, background: '#dbeafe', color: '#1d4ed8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0,
      }}>
        {agency.name[0]}
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#16191f' }}>{agency.name}</span>
        {agency.nameAr && <span style={{ fontSize: 13, color: '#64748b', direction: 'rtl' }}>{agency.nameAr}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
        <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {agency.rating > 0 ? agency.rating.toFixed(1) : 'New'}</span>
        <span style={{ color: '#1a73e8', fontWeight: 700 }}>{agency.priceBase.toFixed(3)} KWD base</span>
        {agency.coverageZones.length > 0 && (
          <span style={{ color: '#64748b' }}>{agency.coverageZones.slice(0, 2).join(', ')}{agency.coverageZones.length > 2 ? ` +${agency.coverageZones.length - 2}` : ''}</span>
        )}
      </div>
    </div>
    {selected && (
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      </div>
    )}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
interface DeliveryForm {
  pickupLabel: string;
  pickupZone: string;
  dropoffLabel: string;
  dropoffZone: string;
  packageType: string;
  notes: string;
}

const EMPTY_FORM: DeliveryForm = {
  pickupLabel: '', pickupZone: '', dropoffLabel: '', dropoffZone: '',
  packageType: 'small', notes: '',
};

const ClientNewDelivery: React.FC = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const { publicAgencies: rawPublicAgencies, isLoading } = useAppSelector(s => s.agency);
  const publicAgencies = Array.isArray(rawPublicAgencies) ? rawPublicAgencies : [];

  const [step, setStep]                       = useState(1);
  const [selectedAgency, setSelectedAgency]   = useState<PublicAgency | null>(null);
  const [form, setForm]                       = useState<DeliveryForm>(EMPTY_FORM);
  const [zoneFilter, setZoneFilter]           = useState('');
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [submitError, setSubmitError]         = useState('');
  const [formError, setFormError]             = useState('');

  useEffect(() => { dispatch(fetchPublicAgencies()); }, [dispatch]);

  // Filter agencies by zone
  const filteredAgencies = zoneFilter
    ? publicAgencies.filter(a => a.coverageZones.includes(zoneFilter))
    : publicAgencies;

  const handleSelectAgency = (agency: PublicAgency) => {
    setSelectedAgency(agency);
  };

  const goToStep2 = () => {
    if (!selectedAgency) { setFormError('Please select an agency. / يرجى اختيار شركة.'); return; }
    setFormError('');
    setStep(2);
  };

  const goToStep3 = () => {
    if (!form.pickupLabel.trim()) { setFormError('Pickup location is required. / عنوان الاستلام مطلوب.'); return; }
    if (!form.dropoffLabel.trim()) { setFormError('Delivery location is required. / عنوان التسليم مطلوب.'); return; }
    if (!form.pickupZone) { setFormError('Please select pickup zone. / يرجى اختيار منطقة الاستلام.'); return; }
    if (!form.dropoffZone) { setFormError('Please select delivery zone. / يرجى اختيار منطقة التسليم.'); return; }
    setFormError('');
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedAgency) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/v1/deliveries', {
        pickupLabel:  `${form.pickupLabel}, ${form.pickupZone}, Kuwait`,
        dropoffLabel: `${form.dropoffLabel}, ${form.dropoffZone}, Kuwait`,
        // Approximate Kuwait City coordinates as fallback (no GPS in this form)
        pickupLat: 29.3759, pickupLng: 47.9774,
        dropoffLat: 29.3759, dropoffLng: 47.9774,
        packageType: form.packageType,
        notes: form.notes,
        agencyId: selectedAgency._id,
        estimatedPrice: selectedAgency.priceBase,
      });
      navigate('/client/deliveries');
    } catch (err) {
      const raw = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSubmitError(raw || 'Order failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#16191f' }}>
          New Delivery / توصيل جديد
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          Choose a delivery company and enter the delivery details.
        </p>
      </div>

      <StepBar step={step} />

      {/* ── Step 1: Choose Agency ─────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          {/* Zone filter */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Filter by zone / تصفية حسب المنطقة
            </label>
            <select
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, width: '100%', outline: 'none', background: '#fff' }}
            >
              <option value="">All zones / جميع المناطق</option>
              {KUWAIT_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {formError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}

          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading agencies…</p>
          ) : filteredAgencies.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
              No agencies available{zoneFilter ? ` in ${zoneFilter}` : ''}.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {filteredAgencies.map(a => (
                <AgencyCard
                  key={a._id}
                  agency={a}
                  selected={selectedAgency?._id === a._id}
                  onClick={() => handleSelectAgency(a)}
                />
              ))}
            </div>
          )}

          <button
            onClick={goToStep2}
            disabled={!selectedAgency}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: selectedAgency ? '#1a73e8' : '#e2e8f0',
              color: selectedAgency ? '#fff' : '#94a3b8',
              fontWeight: 700, fontSize: 14, cursor: selectedAgency ? 'pointer' : 'not-allowed',
              transition: 'all .15s',
            }}
          >
            Continue / متابعة →
          </button>
        </div>
      )}

      {/* ── Step 2: Delivery Details ──────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{selectedAgency?.logo ? '' : '🏢'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedAgency?.name}</div>
              <div style={{ fontSize: 12, color: '#1a73e8' }}>Base price: {selectedAgency?.priceBase.toFixed(3)} KWD</div>
            </div>
          </div>

          {formError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}

          {/* Pickup */}
          <fieldset style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
            <legend style={{ fontSize: 12, fontWeight: 700, color: '#374151', padding: '0 6px' }}>📍 Pickup / نقطة الاستلام</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Address / العنوان *</label>
                <input
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Street, Building No."
                  value={form.pickupLabel}
                  onChange={e => setForm(p => ({ ...p, pickupLabel: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Zone / المنطقة *</label>
                <select
                  value={form.pickupZone}
                  onChange={e => setForm(p => ({ ...p, pickupZone: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">Select zone</option>
                  {KUWAIT_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Dropoff */}
          <fieldset style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
            <legend style={{ fontSize: 12, fontWeight: 700, color: '#374151', padding: '0 6px' }}>📦 Delivery / نقطة التسليم</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Address / العنوان *</label>
                <input
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Street, Building No."
                  value={form.dropoffLabel}
                  onChange={e => setForm(p => ({ ...p, dropoffLabel: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Zone / المنطقة *</label>
                <select
                  value={form.dropoffZone}
                  onChange={e => setForm(p => ({ ...p, dropoffZone: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">Select zone</option>
                  {KUWAIT_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Package */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Package Type / نوع الطرد</label>
            <select
              value={form.packageType}
              onChange={e => setForm(p => ({ ...p, packageType: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, outline: 'none', background: '#fff' }}
            >
              {PACKAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Notes / ملاحظات</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Special instructions, fragile items, etc."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setFormError(''); setStep(1); }}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #1a73e8', background: 'transparent', color: '#1a73e8', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              ← Back
            </button>
            <button
              onClick={goToStep3}
              style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: '#1a73e8', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Review Order / مراجعة الطلب →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirmation ──────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: '#16191f' }}>Order Summary / ملخص الطلب</h3>

            {[
              { label: 'Agency / الشركة',        value: selectedAgency?.name ?? '' },
              { label: 'Pickup / الاستلام',       value: `${form.pickupLabel}, ${form.pickupZone}` },
              { label: 'Delivery / التسليم',      value: `${form.dropoffLabel}, ${form.dropoffZone}` },
              { label: 'Package / الطرد',         value: PACKAGE_TYPES.find(t => t.value === form.packageType)?.label ?? form.packageType },
              { label: 'Base price / السعر',      value: `${selectedAgency?.priceBase.toFixed(3) ?? '—'} KWD` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: '#16191f', textAlign: 'right', maxWidth: '55%' }}>{row.value}</span>
              </div>
            ))}

            {form.notes && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                <span style={{ fontWeight: 600 }}>Notes: </span>{form.notes}
              </div>
            )}
          </div>

          {submitError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep(2)}
              style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #1a73e8', background: 'transparent', color: '#1a73e8', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              ← Edit
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: isSubmitting ? '#93c5fd' : '#1a73e8', color: '#fff', fontWeight: 700, fontSize: 14, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Placing order…' : 'Place Order / إرسال الطلب 🚀'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientNewDelivery;
