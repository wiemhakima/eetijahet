import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

import api from '../../api';

interface ArmadaOrderForm {
  pickupAddress: string;
  pickupLat: string;
  pickupLon: string;
  pickupName: string;
  pickupPhone: string;
  dropoffAddress: string;
  dropoffLat: string;
  dropoffLon: string;
  dropoffName: string;
  dropoffPhone: string;
  description: string;
}

interface ArmadaOrderResult {
  orderId: string;
  status: string;
  tracking_url: string | null;
}

const emptyForm: ArmadaOrderForm = {
  pickupAddress: '',
  pickupLat: '',
  pickupLon: '',
  pickupName: '',
  pickupPhone: '',
  dropoffAddress: '',
  dropoffLat: '',
  dropoffLon: '',
  dropoffName: '',
  dropoffPhone: '',
  description: '',
};

const ArmadaOrderTab: React.FC = () => {
  const [form, setForm] = useState<ArmadaOrderForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ArmadaOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const payload = {
        ...form,
        pickupLat: parseFloat(form.pickupLat),
        pickupLon: parseFloat(form.pickupLon),
        dropoffLat: parseFloat(form.dropoffLat),
        dropoffLon: parseFloat(form.dropoffLon),
      };

      const res = await api.post('/v1/armada/orders', payload);
      setResult(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setError(axiosErr.response?.data?.error || axiosErr.message || 'Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const Field: React.FC<{
    label: string;
    name: keyof ArmadaOrderForm;
    placeholder?: string;
  }> = ({ label, name, placeholder }) => (
    <div className="param-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label className="param-name" style={{ fontSize: '12px', fontWeight: 600 }}>{label}</label>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder || label}
        style={{
          background: 'var(--glass-bg, rgba(255,255,255,0.05))',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          borderRadius: '8px',
          color: 'inherit',
          fontSize: '13px',
          padding: '8px 12px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Pickup */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '14px', fontWeight: 700, opacity: 0.9 }}>
            Pickup
          </h4>
          <div className="params-grid">
            <Field label="Address" name="pickupAddress" placeholder="123 Main St, Kuwait City" />
            <Field label="Latitude" name="pickupLat" placeholder="29.37" />
            <Field label="Longitude" name="pickupLon" placeholder="47.98" />
            <Field label="Contact Name" name="pickupName" placeholder="Ahmed Al-Rashidi" />
            <Field label="Contact Phone" name="pickupPhone" placeholder="+96550000000" />
          </div>
        </div>

        {/* Dropoff */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '14px', fontWeight: 700, opacity: 0.9 }}>
            Dropoff
          </h4>
          <div className="params-grid">
            <Field label="Address" name="dropoffAddress" placeholder="456 Gulf Rd, Salmiya" />
            <Field label="Latitude" name="dropoffLat" placeholder="29.34" />
            <Field label="Longitude" name="dropoffLon" placeholder="48.08" />
            <Field label="Contact Name" name="dropoffName" placeholder="Sara Al-Mutairi" />
            <Field label="Contact Phone" name="dropoffPhone" placeholder="+96560000000" />
          </div>
        </div>

        {/* Description */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <label className="param-name" style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
            Description (optional)
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Fragile package, handle with care…"
            style={{
              width: '100%',
              background: 'var(--glass-bg, rgba(255,255,255,0.05))',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: '8px',
              color: 'inherit',
              fontSize: '13px',
              padding: '8px 12px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <motion.button
          type="submit"
          className={`send-request-btn ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              <span>Creating order…</span>
            </>
          ) : (
            <>
              <span>Create via Armada</span>
              <div className="btn-shine" />
            </>
          )}
        </motion.button>
      </form>

      {/* Result */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            className="response-panel glass-card"
            style={{ padding: '1.25rem' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="response-state error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="result"
            className="response-panel glass-card"
            style={{ padding: '1.25rem' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h3 className="panel-title">Order Created</h3>
              <span className="status-badge success">201 Created</span>
            </div>
            <div className="params-grid">
              <div className="param-card">
                <div className="param-name">Order ID</div>
                <div className="param-desc" style={{ fontFamily: 'monospace', fontSize: '13px' }}>{result.orderId}</div>
              </div>
              <div className="param-card">
                <div className="param-name">Status</div>
                <div className="param-desc">{result.status}</div>
              </div>
              {result.tracking_url && (
                <div className="param-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="param-name">Tracking URL</div>
                  <a
                    href={result.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-color, #6366f1)', fontSize: '13px', wordBreak: 'break-all' }}
                  >
                    {result.tracking_url}
                  </a>
                </div>
              )}
            </div>
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '12px', opacity: 0.7 }}>Raw JSON</summary>
              <pre className="response-json" style={{ marginTop: '0.5rem' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArmadaOrderTab;
