import React, { useEffect, useState } from 'react';
import api from '../../api';
import i18n from '../../i18n';

const STATUS_COLOR: Record<string, string> = {
  pending:    '#f59e0b',
  dispatched: '#3b82f6',
  en_route:   '#8b5cf6',
  delivered:  '#10b981',
  completed:  '#10b981',
  cancelled:  '#ef4444',
  failed:     '#ef4444',
};

const STATUS_LABEL: Record<string, string> = {
  pending:    'En attente',
  dispatched: 'Dispatché',
  en_route:   'En route',
  delivered:  'Livré',
  completed:  'Livré',
  cancelled:  'Annulé',
  failed:     'Échoué',
};

const RecentOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/v1/agencies/me/deliveries?limit=10')
      .then(res => {
        setOrders(res.data?.data || []);
        setError(false);
      })
      .catch(() => {
        setOrders([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Commandes récentes</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Boutique</th>
            <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Client</th>
            <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Statut</th>
            <th style={{ padding: 10, textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Chargement…</td></tr>
          )}
          {!loading && error && (
            <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#ef4444' }}>Erreur de chargement</td></tr>
          )}
          {!loading && !error && orders.length === 0 && (
            <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Aucune commande</td></tr>
          )}
          {orders.map((o, i) => (
            <tr key={o._id ?? i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: 10, fontWeight: 500 }}>
                {o.merchant?.storeName || o.merchant?.name || '—'}
              </td>
              <td style={{ padding: 10 }}>
                <div>{o.customerName || o.clientName || '—'}</div>
                {o.customerPhone && (
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.customerPhone}</div>
                )}
              </td>
              <td style={{ padding: 10 }}>
                <span style={{
                  background: STATUS_COLOR[o.status] || '#6b7280',
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {STATUS_LABEL[o.status] || o.status}
                </span>
              </td>
              <td style={{ padding: 10, color: '#6b7280', fontSize: 13 }}>
                {new Date(o.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentOrders;
