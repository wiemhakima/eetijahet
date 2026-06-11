import 'leaflet/dist/leaflet.css';

import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import React, { useState } from 'react';

import L from 'leaflet';
import MerchantLayout from '../MerchantLayout/MerchantLayout';
import api from '../../../api';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet default marker icons with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',   import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

interface FormState {
  clientName:      string;
  clientPhone:     string;
  clientEmail:     string;
  pickupAddress:   string;
  deliveryAddress: string;
  deliveryCity:    string;
  productPrice:    string;
  deliveryPrice:   string;
  packageType:     string;
  paymentType:     string;
  description:     string;
  notes:           string;
}

interface LatLon { lat: number; lon: number }

const KUWAIT_CITIES = [
  'Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Ahmadi', 'Jahra',
];

const EMPTY: FormState = {
  clientName: '', clientPhone: '', clientEmail: '',
  pickupAddress: '', deliveryAddress: '',
  deliveryCity: '', productPrice: '', deliveryPrice: '',
  packageType: 'medium', paymentType: 'paid', description: '', notes: '',
};

// Kuwait center
const KW_CENTER: [number, number] = [29.3759, 47.9774];

interface Result {
  trackingCode:     string;
  commission:       number;
  driversNotified:  number;
  armadaOrderId:    string | null;
  armadaStatus:     string | null;
  armadaTrackingUrl: string | null;
}

// ── Inner component: listens to map clicks and updates pin position ────────────
function DropoffPicker({ onPick }: { onPick: (ll: LatLon) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [form,      setForm]    = useState<FormState>(EMPTY);
  const [dropoff,   setDropoff] = useState<LatLon | null>(null);
  const [loading,   setLoading] = useState(false);
  const [error,     setError]   = useState('');
  const [result,    setResult]  = useState<Result | null>(null);

  const set = (field: keyof FormState, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.clientName || !form.deliveryAddress) {
      setError('Client name and delivery address are required.');
      return;
    }

    setLoading(true);
    try {
      const armadaRes = await api.post('/v1/orders', {
        paymentType:  form.paymentType || 'paid',
        amount:       String(parseFloat(form.productPrice) || 0),
        description:  form.description || form.notes || 'Delivery order',
        vehicleType:  'any',
        destination: {
          address: {
            city:      form.deliveryCity || 'Kuwait City',
            firstLine: form.deliveryAddress,
            location: {
              latitude:  dropoff?.lat  ?? 29.3341,
              longitude: dropoff?.lon  ?? 48.0289,
            },
          },
          name:  form.clientName,
          phone: form.clientPhone || '',
        },
      });

      if (armadaRes.data.orderStatus === 'failed') {
        setError('No driver available now. Order created and will retry automatically.');
      } else {
        setResult({
          trackingCode:      armadaRes.data.id          || '—',
          commission:        0,
          driversNotified:   0,
          armadaOrderId:     armadaRes.data.id          || null,
          armadaStatus:      armadaRes.data.orderStatus || null,
          armadaTrackingUrl: armadaRes.data.trackingLink || null,
        });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message
               || (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Error creating order');
    }
    setLoading(false);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <MerchantLayout>
        <div style={{ maxWidth: 480, margin: '60px auto', background: 'white', borderRadius: 16, padding: 36, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', color: '#1e293b' }}>Order Created!</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>The delivery request is being broadcast to available drivers.</p>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 20, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Tracking Code</span>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: '#1e293b', marginTop: 4 }}>
                {result.trackingCode}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Commission</span>
                <div style={{ fontWeight: 600, color: '#d97706' }}>{result.commission.toFixed(2)} KWD</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Drivers notified</span>
                <div style={{ fontWeight: 600 }}>{result.driversNotified}</div>
              </div>
            </div>
          </div>

          {result.armadaOrderId && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>Armada Delivery</div>
              <div style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>
                <span style={{ opacity: 0.7 }}>Order ID: </span>
                <code style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>
                  {result.armadaOrderId}
                </code>
              </div>
              {result.armadaStatus && (
                <div style={{ fontSize: 13, color: '#166534', marginBottom: 4 }}>
                  <span style={{ opacity: 0.7 }}>Status: </span>{result.armadaStatus}
                </div>
              )}
              {result.armadaTrackingUrl && (
                <div style={{ fontSize: 13 }}>
                  <a href={result.armadaTrackingUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#16a34a', textDecoration: 'underline', wordBreak: 'break-all' }}>
                    Track on Armada →
                  </a>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="merchant-btn merchant-btn--outline"
              onClick={() => window.open(`/track?code=${result.trackingCode}`, '_blank')}>
              Track Order
            </button>
            <button className="merchant-btn merchant-btn--primary"
              onClick={() => { setResult(null); setForm(EMPTY); setDropoff(null); }}>
              New Order
            </button>
          </div>

          <button style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
            onClick={() => navigate('/merchant/orders')}>
            View all orders →
          </button>
        </div>
      </MerchantLayout>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <MerchantLayout>
      <div className="merchant-page-header">
        <div>
          <h1>New Order</h1>
          <p>Create a delivery request for your customer</p>
        </div>
      </div>

      <div style={{ maxWidth: 640, background: 'white', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        {error && <div className="merchant-alert merchant-alert--error">{error}</div>}

        <form className="merchant-form" onSubmit={handleSubmit}>
          {/* Customer info */}
          <h3 style={{ margin: '0 0 4px', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Customer Info
          </h3>

          <div className="merchant-form__row">
            <div className="merchant-form__group">
              <label>Customer Name *</label>
              <input type="text" placeholder="Ahmed Ben Ali"
                value={form.clientName} onChange={e => set('clientName', e.target.value)} required />
            </div>
            <div className="merchant-form__group">
              <label>Phone</label>
              <input type="tel" placeholder="+965 XXXX XXXX"
                value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} />
            </div>
          </div>

          <div className="merchant-form__group">
            <label>Customer Email <span style={{ color: '#94a3b8', fontWeight: 400 }}>(tracking link will be sent)</span></label>
            <input type="email" placeholder="customer@example.com"
              value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} />
          </div>

          {/* Addresses */}
          <h3 style={{ margin: '8px 0 4px', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Addresses
          </h3>

          <div className="merchant-form__group">
            <label>Pickup Address <span style={{ color: '#94a3b8', fontWeight: 400 }}>(leave empty to use your store address)</span></label>
            <input type="text" placeholder="Your store address"
              value={form.pickupAddress} onChange={e => set('pickupAddress', e.target.value)} />
          </div>

          <div className="merchant-form__group">
            <label>Delivery Address *</label>
            <input type="text" placeholder="Customer delivery address"
              value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} required />
          </div>

          <div className="merchant-form__group">
            <label>City *</label>
            <select value={form.deliveryCity} onChange={e => set('deliveryCity', e.target.value)} required>
              <option value="">Select City</option>
              {KUWAIT_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>

          {/* Dropoff location map */}
          <div className="merchant-form__group">
            <label>
              Dropoff Location on Map
              {dropoff
                ? <span style={{ marginLeft: 8, fontSize: 12, color: '#16a34a', fontWeight: 400 }}>
                    📍 {dropoff.lat.toFixed(5)}, {dropoff.lon.toFixed(5)}
                  </span>
                : <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
                    Click on the map to pin the delivery location
                  </span>
              }
            </label>
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', height: 260 }}>
              <MapContainer center={KW_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <DropoffPicker onPick={setDropoff} />
                {dropoff && <Marker position={[dropoff.lat, dropoff.lon]} />}
              </MapContainer>
            </div>
          </div>

          {/* Prices */}
          <h3 style={{ margin: '8px 0 4px', fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pricing
          </h3>

          <div className="merchant-form__row">
            <div className="merchant-form__group">
              <label>Product Price (KWD)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00"
                value={form.productPrice} onChange={e => set('productPrice', e.target.value)} />
            </div>
            <div className="merchant-form__group">
              <label>Delivery Fee (KWD)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00"
                value={form.deliveryPrice} onChange={e => set('deliveryPrice', e.target.value)} />
            </div>
          </div>

          {/* Package & Payment */}
          <div className="merchant-form__row">
            <div className="merchant-form__group">
              <label>Package Type</label>
              <select value={form.packageType} onChange={e => set('packageType', e.target.value)}>
                <option value="document">Document</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="fragile">Fragile</option>
                <option value="food">Food</option>
              </select>
            </div>
            <div className="merchant-form__group">
              <label>Payment Type</label>
              <select value={form.paymentType} onChange={e => set('paymentType', e.target.value)}>
                <option value="paid">Paid</option>
                <option value="cod">Cash on Delivery (COD)</option>
              </select>
            </div>
          </div>

          <div className="merchant-form__group">
            <label>Description *</label>
            <input
              type="text"
              placeholder="Order description (required by Armada)"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              required
            />
          </div>

          <div className="merchant-form__group">
            <label>Notes</label>
            <textarea placeholder="Special instructions for the driver…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button type="button" className="merchant-btn merchant-btn--outline"
              onClick={() => navigate('/merchant/orders')}>
              Cancel
            </button>
            <button type="submit" className="merchant-btn merchant-btn--primary" disabled={loading}>
              {loading ? 'Creating…' : '🚚 Create Order'}
            </button>
          </div>
        </form>
      </div>
    </MerchantLayout>
  );
};

export default CreateOrder;
