import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../../store/hooks'; // auth state stays in Redux
import { useAgencySocket } from '../../../hooks/useSocket';
import api from '../../../api';
import '../AgencyDashboard/AgencyDashboard.scss';
import './AgencyMerchants.scss';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LocationPickerModal from '../../../components/LocationPickerModal';
import BaseModal from '../../../components/ui/BaseModal/BaseModal';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MerchantUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Merchant {
  _id: string;
  storeName: string;
  logo?: string;
  commission: number;
  isActive: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  address?: { street?: string; city?: string; lat?: number; lng?: number };
  stats?: { totalOrders: number; totalRevenue: number; totalCommission: number };
  user: MerchantUser;
  createdAt: string;
}

interface MerchantForm {
  storeName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  lat: string;
  lng: string;
  commission: number;
  logo: string;
}

interface FieldErrors {
  storeName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
}

type ViewMode = 'cards' | 'table' | 'map';

// ─── Constants ──────────────────────────────────────────────────────────────────

const KUWAIT: [number, number] = [29.3759, 47.9774];

const PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#22c55e'];

const EMPTY: MerchantForm = {
  storeName: '', contactName: '', email: '',
  phone: '', address: '', city: '', lat: '', lng: '', commission: 10, logo: '',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function hasLocation(m: any): boolean {
  try {
    const lat = Number(m?.address?.lat);
    const lng = Number(m?.address?.lng);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  } catch {
    return false;
  }
}

function chipColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return PALETTE[h % PALETTE.length];
}

function toInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

function initialsColor(name: string): string {
  const c = name[0]?.toUpperCase() ?? 'A';
  if (c >= 'A' && c <= 'F') return '#3b82f6';
  if (c >= 'G' && c <= 'L') return '#10b981';
  if (c >= 'M' && c <= 'R') return '#f97316';
  return '#8b5cf6';
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const d = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(d(lat2 - lat1) / 2) ** 2 +
    Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lng2 - lng1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pinIcon(color: string, label: string, selected = false): L.DivIcon {
  return L.divIcon({
    html: `<div class="am-pin${selected ? ' am-pin--sel' : ''}" style="--c:${color}"><span>${label}</span></div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
  });
}

// ─── Custom store map icon ──────────────────────────────────────────────────────

function createStoreIcon(logoUrl?: string, storeName?: string): L.DivIcon {
  const initials = storeName?.slice(0, 2).toUpperCase() || '??';
  const html = logoUrl
    ? `<div style="width:46px;height:46px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #3b82f6;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);overflow:hidden;display:flex;align-items:center;justify-content:center;">
        <img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover;transform:rotate(45deg);border-radius:50%;"/>
       </div>`
    : `<div style="width:46px;height:46px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #3b82f6;background:linear-gradient(135deg,#3b82f6,#1d4ed8);box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:#fff;font-weight:700;font-size:13px;">${initials}</span>
       </div>`;
  return L.divIcon({ html, className: '', iconSize: [46, 46], iconAnchor: [23, 46], popupAnchor: [0, -50] });
}

// ─── Component ─────────────────────────────────────────────────────────────────

const AgencyMerchants: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { user } = useAppSelector(s => s.auth);
  const isAdmin  = user?.role === 'agency_admin';
  const [onlineMerchants, setOnlineMerchants] = useState<string[]>([]);
  // Use user.agency (always populated after login) instead of the agency Redux object
  // which requires a separate fetchAgency() dispatch to be populated.
  useAgencySocket(user?.agency as string | undefined);

  // Core data
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [stats, setStats] = useState<{
    totalMerchants: number;
    activeMerchants: number;
    totalCommissions: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');

  // Add merchant modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<MerchantForm>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [newCreds, setNewCreds] = useState<{ email: string; password: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Edit modal
  const [editModalOpen,    setEditModalOpen]    = useState(false);
  const [editingMerchant,  setEditingMerchant]  = useState<Merchant | null>(null);
  const [editForm,         setEditForm]         = useState({
    storeName:  '',
    commission: 10,
    address:    '',
    city:       '',
    lat:        null as number | null,
    lng:        null as number | null,
    isActive:   true,
  });
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [editLoading,  setEditLoading]  = useState(false);
  const [editError,    setEditError]    = useState('');

  // Add-modal location picker
  const [pickerOpen, setPickerOpen] = useState(false);

  // Logo upload modal
  const [logoModal, setLogoModal] = useState<Merchant | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Map / tour planning
  const [tourMode, setTourMode] = useState(false);
  const [tourSel, setTourSel] = useState<Set<string>>(new Set());
  const [routeInfo, setRouteInfo] = useState<{
    merchants: Merchant[];
    distance: number;
    time: number;
  } | null>(null);

  // ─── Data loading ─────────────────────────────────────────────────────────────

  const loadAll = async () => {
    setLoading(true);
    try {
      const mRes = await api.get('/v1/agencies/me/merchants');
      const rawM = mRes.data.data;
      const list = Array.isArray(rawM) ? rawM : (rawM?.merchants ?? rawM?.data ?? []);
      console.log('[AgencyMerchants] merchants loaded:', list.length);
      setMerchants(list);
    } catch (e) {
      console.error('[AgencyMerchants] merchants load failed:', e);
    }
    try {
      const sRes = await api.get('/v1/agencies/me/merchants/stats');
      setStats(sRes.data.data);
    } catch (e) {
      console.error('[AgencyMerchants] stats load failed:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);


  // ─── Add-modal helpers ────────────────────────────────────────────────────────

  const openModal = () => {
    setForm(EMPTY);
    setFieldErrors({});
    setFormError('');
    setNewCreds(null);
    setLogoError(false);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setNewCreds(null); };

  const setF = <K extends keyof MerchantForm>(k: K, v: MerchantForm[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (k in fieldErrors) setFieldErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!form.storeName.trim())   errs.storeName   = t('agency.merchants.form.errStoreName');
    if (!form.contactName.trim()) errs.contactName = t('agency.merchants.form.errContactName');
    if (!form.email.trim())       errs.email       = t('agency.merchants.form.errEmail');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('agency.merchants.form.errEmailInvalid');
    if (form.phone && !/^\d{7,8}$/.test(form.phone.replace(/\s/g, '')))
      errs.phone = t('agency.merchants.form.errPhone');
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/v1/agencies/me/merchants', {
        storeName:   form.storeName.trim(),
        contactName: form.contactName.trim(),
        email:       form.email.trim(),
        phone:       form.phone ? `+965${form.phone.replace(/\s/g, '')}` : '',
        address:     form.address.trim(),
        city:        form.city.trim(),
        lat:         form.lat ? parseFloat(form.lat) : undefined,
        lng:         form.lng ? parseFloat(form.lng) : undefined,
        commission:  form.commission,
        logo:        form.logo.trim(),
      });
      if (res.data.credentials) setNewCreds(res.data.credentials);
      loadAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFormError(msg || t('agency.merchants.form.errCreate'));
    }
    setSubmitting(false);
  };

  // ─── Merchant actions ─────────────────────────────────────────────────────────

  const handleToggle = async (merchant: Merchant) => {
    try {
      await api.put(`/v1/agencies/me/merchants/${merchant._id}`, { isActive: !merchant.isActive });
      loadAll();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (merchant: Merchant) => {
    if (!window.confirm(`Remove merchant "${merchant.storeName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/v1/agencies/me/merchants/${merchant._id}`);
      loadAll();
    } catch (e) { console.error(e); }
  };

  // ─── Edit modal ───────────────────────────────────────────────────────────────

  const openEditModal = (m: Merchant) => {
    setEditingMerchant(m);
    setEditForm({
      storeName:  m.storeName          || '',
      commission: m.commission         || 10,
      address:    m.address?.street    || '',
      city:       m.address?.city      || '',
      lat:        m.address?.lat       ?? null,
      lng:        m.address?.lng       ?? null,
      isActive:   m.isActive           ?? true,
    });
    setEditError('');
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingMerchant) return;
    setEditLoading(true);
    setEditError('');
    try {
      const body: Record<string, unknown> = {
        storeName:  editForm.storeName,
        commission: editForm.commission,
        address:    editForm.address,
        city:       editForm.city,
        isActive:   editForm.isActive,
      };
      if (editForm.lat !== null) body.lat = editForm.lat;
      if (editForm.lng !== null) body.lng = editForm.lng;

      await api.put(`/v1/agencies/me/merchants/${editingMerchant._id}`, body);
      loadAll();
      setViewMode('map');
      setEditModalOpen(false);
      setEditingMerchant(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setEditError(msg || t('agency.merchants.form.errEdit'));
    }
    setEditLoading(false);
  };

  // ─── Location picker confirm (add modal) ──────────────────────────────────────

  const handlePickerConfirm = (lat: number, lng: number, address: string) => {
    const cityPart = address.split(',').find(part => isNaN(parseFloat(part.trim())))?.trim() || '';
    setF('lat', lat.toString());
    setF('lng', lng.toString());
    setF('city', cityPart || form.city);
  };

  // ─── Logo upload ──────────────────────────────────────────────────────────────

  const openLogoModal = (m: Merchant) => {
    setLogoModal(m);
    setLogoPreview(m.logo || '');
  };

  const onLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoSave = async () => {
    if (!logoModal) return;
    setLogoUploading(true);
    try {
      await api.put(`/v1/agencies/me/merchants/${logoModal._id}`, { logo: logoPreview });
      setMerchants(prev =>
        prev.map(m => (m._id === logoModal._id ? { ...m, logo: logoPreview } : m)),
      );
      setLogoModal(null);
    } catch (e) { console.error(e); }
    setLogoUploading(false);
  };

  // ─── Tour planning ────────────────────────────────────────────────────────────

  const toggleTour = (id: string) => {
    setTourSel(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setRouteInfo(null);
  };

  const calcRoute = () => {
    const sel = safeMerchants.filter(m => tourSel.has(m._id) && hasLocation(m));
    if (sel.length < 2) return;
    let dist = 0;
    for (let i = 0; i < sel.length - 1; i++) {
      const a = sel[i].address!;
      const b = sel[i + 1].address!;
      dist += haversine(a.lat!, a.lng!, b.lat!, b.lng!);
    }
    setRouteInfo({ merchants: sel, distance: dist, time: (dist / 40) * 60 });
  };

  const startTour = () => { setTourMode(true); setTourSel(new Set()); setRouteInfo(null); };
  const cancelTour = () => { setTourMode(false); setTourSel(new Set()); setRouteInfo(null); };

  // ─── Computed ─────────────────────────────────────────────────────────────────

  const safeMerchants = Array.isArray(merchants) ? merchants : [];
  const commissionPct = `${(form.commission / 30) * 100}%`;
  const editCommPct   = `${(editForm.commission / 30) * 100}%`;
  const mappable      = safeMerchants.filter(m => hasLocation(m));

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: Card view
  // ══════════════════════════════════════════════════════════════════════════════

  const renderCards = () => (
    <div className="am-cards-grid">
      {safeMerchants.map(m => {
        const color    = chipColor(m.storeName);
        const ini      = toInitials(m.storeName);
        const hasCoords = hasLocation(m);
        return (
          <div key={m._id} className="am-card">

            <div className="am-card__top">
              <div className="am-card__avatar" style={{ background: m.logo ? '#f8fafc' : color }}>
                {m.logo
                  ? <img src={m.logo} alt={m.storeName}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <span>{ini}</span>}
              </div>
              <div className="am-card__info">
                <div className="am-card__name">{m.storeName}</div>
                <div className="am-card__badges">
                  <span className="am-badge am-badge--commission">{m.commission}%</span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: (onlineMerchants.includes(m._id) || !!m.isOnline) ? '#dcfce7' : '#f1f5f9',
                    color:      (onlineMerchants.includes(m._id) || !!m.isOnline) ? '#16a34a' : '#94a3b8',
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: (onlineMerchants.includes(m._id) || !!m.isOnline) ? '#16a34a' : '#94a3b8',
                      display: 'inline-block',
                      animation: (onlineMerchants.includes(m._id) || !!m.isOnline) ? 'pulse 2s infinite' : 'none',
                    }}/>
                    {(onlineMerchants.includes(m._id) || !!m.isOnline) ? t('agency.merchants.online') : t('agency.merchants.offline')}
                  </span>
                  {!hasCoords && (
                    <span
                      className="am-badge am-badge--warn"
                      title={t('agency.merchants.form.gpsLabel')}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        openEditModal(m);
                        setTimeout(() => {
                          document.getElementById('location-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 300);
                      }}
                    >
                      {t('agency.merchants.locationMissingBadge')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="am-card__stats">
              <span>📦 {m.stats?.totalOrders ?? 0} {t('agency.merchants.orders')}</span>
              <span className="am-card__sep">·</span>
              <span>💰 {(m.stats?.totalRevenue ?? 0).toFixed(2)} KWD</span>
            </div>

            <div className="am-card__contact">
              {m.user?.phone && <span>📞 {m.user.phone}</span>}
              <span>✉️ {m.user?.email ?? '—'}</span>
              {m.address?.city
                ? <span>📍 {m.address.city}{m.address.street ? `, ${m.address.street}` : ''}</span>
                : <span style={{ color: '#f59e0b' }}>📍 {t('agency.merchants.locationMissing')}</span>
              }
            </div>

            {isAdmin && (
              <div className="am-card__actions">
                <button className="am-card-btn am-card-btn--primary"
                  onClick={() => navigate(`/agency/deliveries?merchant=${m._id}`)}>
                  {t('agency.merchants.btnOrders')}
                </button>
                <button className="am-card-btn am-card-btn--outline" onClick={() => openEditModal(m)}>
                  {t('agency.merchants.btnEdit')}
                </button>
                <button className="am-card-btn am-card-btn--outline" onClick={() => openLogoModal(m)}>
                  📷 {t('agency.merchants.btnLogo')}
                </button>
                <button className="am-card-btn am-card-btn--danger" onClick={() => handleDelete(m)}>
                  {t('agency.merchants.btnDelete')}
                </button>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: Table view
  // ══════════════════════════════════════════════════════════════════════════════

  const renderTable = () => {
    const lower = searchQuery.toLowerCase();
    const rows = lower
      ? safeMerchants.filter(m =>
          m.storeName.toLowerCase().includes(lower) ||
          `${m.user?.firstName ?? ''} ${m.user?.lastName ?? ''}`.toLowerCase().includes(lower) ||
          (m.user?.email ?? '').toLowerCase().includes(lower)
        )
      : safeMerchants;

    return (
      <div className="am-tbl-wrap">
        <table className="am-tbl">
          <thead>
            <tr>
              <th>{t('agency.merchants.colStore')}</th>
              <th>{t('agency.merchants.colContact')}</th>
              <th>{t('agency.merchants.colEmail')}</th>
              <th>{t('agency.merchants.colCommission')}</th>
              <th>{t('agency.merchants.colOrders')}</th>
              <th>{t('agency.merchants.colRevenue')}</th>
              <th>{t('agency.merchants.colStatus')}</th>
              {isAdmin && <th>{t('agency.merchants.colActions')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(m => {
              const ini        = toInitials(m.storeName);
              const avatarBg   = initialsColor(m.storeName);
              const isOnline   = onlineMerchants.includes(m._id) || !!m.isOnline;
              const emailRaw   = m.user?.email ?? '';
              const emailShort = emailRaw.length > 20 ? emailRaw.slice(0, 20) + '…' : emailRaw;
              const safeCity   = (() => { const v = m.address?.city; return (!v || !isNaN(Number(v))) ? '' : v; })();
              return (
                <tr key={m._id} className="am-tbl__row">

                  {/* Boutique: logo + name + city */}
                  <td className="am-tbl__td">
                    <div className="am-tbl__boutique">
                      <div className="am-tbl-avatar" style={{ background: m.logo ? '#f8fafc' : avatarBg }}>
                        {m.logo
                          ? <img src={m.logo} alt={m.storeName}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <span>{ini}</span>}
                      </div>
                      <div>
                        <div className="am-tbl__store-name">{m.storeName}</div>
                        {safeCity && <div className="am-tbl__store-city">{safeCity}</div>}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="am-tbl__td">
                    <div className="am-tbl__contact-name">
                      {m.user?.firstName ?? '—'} {m.user?.lastName ?? ''}
                    </div>
                    {m.user?.phone && <div className="am-tbl__contact-phone">{m.user.phone}</div>}
                  </td>

                  {/* Email */}
                  <td className="am-tbl__td">
                    <span className="am-tbl__email" title={emailRaw}>{emailShort || '—'}</span>
                  </td>

                  {/* Commission */}
                  <td className="am-tbl__td">
                    <span className="am-tbl__commission">{m.commission}%</span>
                  </td>

                  {/* Commandes */}
                  <td className="am-tbl__td">
                    <div className="am-tbl__orders-num">{m.stats?.totalOrders ?? 0}</div>
                    <div className="am-tbl__orders-label">{t('agency.merchants.orders')}</div>
                  </td>

                  {/* Revenu */}
                  <td className="am-tbl__td">
                    <span className="am-tbl__revenue">{(m.stats?.totalRevenue ?? 0).toFixed(2)}</span>
                    <span className="am-tbl__revenue-label"> KWD</span>
                  </td>

                  {/* Statut */}
                  <td className="am-tbl__td">
                    <div className={`am-tbl__status${isOnline ? ' am-tbl__status--online' : ''}`}>
                      <span className={`am-tbl__status-dot${isOnline ? ' online-dot' : ''}`} />
                      {isOnline ? t('agency.merchants.online') : t('agency.merchants.offline')}
                    </div>
                  </td>

                  {/* Actions — admin only */}
                  {isAdmin && (
                    <td className="am-tbl__td am-actions-cell">
                      <div className="am-tbl__actions">
                        <button
                          className="am-tbl__action-btn am-tbl__action-btn--edit"
                          title={t('agency.merchants.tooltipEdit')}
                          onClick={() => openEditModal(m)}
                        >✏️</button>
                        <button
                          className="am-tbl__action-btn am-tbl__action-btn--logo"
                          title="Logo"
                          onClick={() => openLogoModal(m)}
                        >🖼️</button>
                        <button
                          className={`am-tbl__action-btn${m.isActive ? ' am-tbl__action-btn--deactivate' : ' am-tbl__action-btn--activate'}`}
                          title={m.isActive ? t('agency.merchants.tooltipDeactivate') : t('agency.merchants.tooltipActivate')}
                          onClick={() => handleToggle(m)}
                        >{m.isActive ? '⏸' : '▶'}</button>
                        <button
                          className="am-tbl__action-btn am-tbl__action-btn--delete"
                          title={t('agency.merchants.tooltipDelete')}
                          onClick={() => handleDelete(m)}
                        >🗑️</button>
                      </div>
                    </td>
                  )}

                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="am-tbl__empty-row">
                  {t('agency.merchants.noResults', { query: searchQuery })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER: Map view
  // ══════════════════════════════════════════════════════════════════════════════

  const renderMap = () => (
    <div className="am-map-section">

      <div className="am-map-toolbar">
        {!tourMode ? (
          <button className="ag-btn ag-btn--outline" onClick={startTour}>
            🗺️ {t('agency.merchants.tourPlan')}
          </button>
        ) : (
          <>
            <span className="am-tour-hint">
              {t('agency.merchants.tourSelected', { count: tourSel.size })}
            </span>
            <button className="ag-btn ag-btn--primary" disabled={tourSel.size < 2} onClick={calcRoute}>
              {t('agency.merchants.tourCalc')}
            </button>
            <button className="ag-btn ag-btn--outline" onClick={cancelTour}>
              {t('agency.merchants.tourCancel')}
            </button>
          </>
        )}
        {mappable.length < merchants.length && (
          <span className="am-map-missing">
            ⚠️ {t('agency.merchants.noCoords', { count: merchants.length - mappable.length })}
          </span>
        )}
      </div>

      <div className="am-map-container">
        <MapContainer center={KUWAIT} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {mappable.map(m => {
            const color    = chipColor(m.storeName);
            const ini      = toInitials(m.storeName);
            const selected = tourSel.has(m._id);
            return (
              <Marker
                key={m._id}
                position={[m.address!.lat!, m.address!.lng!]}
                icon={tourMode ? pinIcon(selected ? '#1a73e8' : color, ini, selected) : createStoreIcon(m.logo, m.storeName)}
                eventHandlers={{ click: () => tourMode && toggleTour(m._id) }}
              >
                {!tourMode && (
                  <Popup>
                    <div style={{ minWidth: 180, padding: 4, fontFamily: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        {m.logo
                          ? <img src={m.logo} alt={m.storeName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                          : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                              {m.storeName?.slice(0, 2).toUpperCase()}
                            </div>
                        }
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#16191f' }}>{m.storeName}</div>
                          <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{m.commission}% commission</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                        📦 {m.stats?.totalOrders || 0} {t('agency.merchants.orders')} &nbsp;·&nbsp;
                        💰 {(m.stats?.totalRevenue || 0).toFixed(2)} KWD
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                        📍 {m.address?.city || 'Kuwait'}
                      </div>
                      <button
                        onClick={() => navigate(`/agency/deliveries?merchant=${m._id}`)}
                        style={{ width: '100%', padding: '6px 0', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
                      >
                        {t('agency.merchants.btnOrders')} →
                      </button>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}

          {routeInfo && routeInfo.merchants.length >= 2 && (
            <Polyline
              positions={routeInfo.merchants.map(
                m => [m.address!.lat!, m.address!.lng!] as [number, number],
              )}
              color="#1a73e8"
              weight={3}
              dashArray="10 6"
            />
          )}
        </MapContainer>
      </div>

      {routeInfo && (
        <div className="am-route-panel">
          <div className="am-route-panel__title">🗺️ {t('agency.merchants.routeTitle')}</div>
          <div className="am-route-panel__path">
            {routeInfo.merchants.map(m => m.storeName).join(' → ')}
          </div>
          <div className="am-route-panel__stats">
            <div className="am-route-stat">
              <span>📏 {t('agency.merchants.routeDistance')}</span>
              <strong>~{routeInfo.distance.toFixed(1)} km</strong>
            </div>
            <div className="am-route-stat">
              <span>⏱️ {t('agency.merchants.routeTime')}</span>
              <strong>~{Math.round(routeInfo.time)} {t('agency.merchants.routeTimeUnit')}</strong>
            </div>
            <div className="am-route-stat">
              <span>📍 {t('agency.merchants.routeStops')}</span>
              <strong>{routeInfo.merchants.length}</strong>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="agency-dashboard">

      {/* ── Header ── */}
      <div className="ag-page-header">
        <div>
          <h1>{t('agency.merchants.title')}</h1>
          <p>{merchants.length} {t('merchantsInAgency')}</p>
        </div>
        <div className="am-header-right">
          <div className="am-view-toggle">
            {(['table', 'cards', 'map'] as ViewMode[]).map(v => (
              <button
                key={v}
                className={`am-view-toggle__btn${viewMode === v ? ' am-view-toggle__btn--active' : ''}`}
                onClick={() => setViewMode(v)}
              >
                {v === 'table' ? t('agency.merchants.viewTable') : v === 'cards' ? t('agency.merchants.viewCards') : t('agency.merchants.viewMap')}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button className="ag-btn ag-btn--primary" onClick={openModal}>
              {t('agency.merchants.btnAdd')}
            </button>
          )}
        </div>
      </div>

      {/* ── Stats bar ── */}
      {stats && (
        <div className="am-stats-bar">
          {[
            { label: t('agency.merchants.statTotal'),       value: stats.totalMerchants,   color: '#3b82f6' },
            { label: t('agency.merchants.statActive'),      value: stats.activeMerchants,  color: '#22c55e' },
            { label: t('agency.merchants.statCommissions'), value: `${(stats.totalCommissions ?? 0).toFixed(2)} KWD`, color: '#f97316' },
          ].map(s => (
            <div key={s.label} className="am-stat-card" style={{ borderColor: s.color }}>
              <div className="am-stat-card__label">{s.label}</div>
              <div className="am-stat-card__value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search bar (table view only) ── */}
      {viewMode === 'table' && merchants.length > 0 && (
        <div className="am-search-bar">
          <span className="am-search-bar__icon">🔍</span>
          <input
            type="text"
            className="am-search-bar__input"
            placeholder={t('agency.merchants.search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="am-search-bar__clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div className="ag-section">
        {loading && merchants.length === 0 ? (
          <p className="ag-empty">{t('agency.merchants.loading')}</p>
        ) : merchants.length === 0 ? (
          <div className="am-empty-state">
            <div className="am-empty-state__icon">🏪</div>
            <div className="am-empty-state__title">{t('agency.merchants.emptyTitle')}</div>
            <div className="am-empty-state__sub">{t('agency.merchants.emptySub')}</div>
            {isAdmin && (
              <button className="ag-btn ag-btn--primary" onClick={openModal}>{t('agency.merchants.addFirst')}</button>
            )}
          </div>
        ) : viewMode === 'cards' ? renderCards()
          : viewMode === 'table' ? renderTable()
          : renderMap()}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ADD MERCHANT MODAL
          ══════════════════════════════════════════════════════════════ */}
      <BaseModal
        show={showModal}
        title={`🏪 ${t('agency.merchants.form.addTitle')}`}
        onClose={closeModal}
      >
              {newCreds ? (
                <div className="am-success">
                  <div className="am-success__icon">🎉</div>
                  <div className="am-success__title">{t('agency.merchants.form.successTitle')}</div>
                  <div className="am-success__sub">{t('agency.merchants.form.successSub')}</div>
                  <div className="am-creds-box">
                    <div className="am-creds-box__title">{t('agency.merchants.form.credsTitle')}</div>
                    <div className="am-creds-box__row">
                      <span className="am-creds-box__label">Email</span>
                      <span className="am-creds-box__val">{newCreds.email}</span>
                    </div>
                    <div className="am-creds-box__row">
                      <span className="am-creds-box__label">{t('agency.merchants.form.credsPassword')}</span>
                      <span className="am-creds-box__val">{newCreds.password}</span>
                    </div>
                    <p className="am-creds-box__note">📧 {t('agency.merchants.form.credsNote')}</p>
                  </div>
                  <button className="ag-btn ag-btn--primary" style={{ width: '100%' }} onClick={closeModal}>
                    {t('agency.merchants.form.doneBtn')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {formError && <div className="ag-alert ag-alert--error">{formError}</div>}

                  {/* Section 1: Store */}
                  <div className="am-section">
                    <p className="am-section__title">{t('agency.merchants.form.sectionStore')}</p>
                    <div className="am-logo-row">
                      <div className={`am-logo-preview${form.logo && !logoError ? ' am-logo-preview--active' : ''}`}>
                        {form.logo && !logoError
                          ? <img src={form.logo} alt="logo" onError={() => setLogoError(true)} />
                          : '🏪'}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="am-form-group">
                          <label>{t('agency.merchants.form.storeName')} *</label>
                          <input
                            type="text"
                            placeholder={t('agency.merchants.form.storeNamePlaceholder')}
                            value={form.storeName}
                            onChange={e => setF('storeName', e.target.value)}
                            className={fieldErrors.storeName ? 'am-input--error' : ''}
                          />
                          {fieldErrors.storeName && <span className="am-error-msg">{fieldErrors.storeName}</span>}
                        </div>
                        <div className="am-form-group am-logo-input">
                          <label>{t('agency.merchants.form.logoUrl')} <span className="am-optional">({t('agency.merchants.form.optional')})</span></label>
                          <input
                            type="url"
                            placeholder="https://example.com/logo.png"
                            value={form.logo}
                            onChange={e => { setLogoError(false); setF('logo', e.target.value); }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Contact */}
                  <div className="am-section">
                    <p className="am-section__title">{t('agency.merchants.form.sectionContact')}</p>
                    <div className="am-form-group" style={{ marginBottom: 12 }}>
                      <label>{t('agency.merchants.form.contactName')} *</label>
                      <input
                        type="text"
                        placeholder={t('agency.merchants.form.contactNamePlaceholder')}
                        value={form.contactName}
                        onChange={e => setF('contactName', e.target.value)}
                        className={fieldErrors.contactName ? 'am-input--error' : ''}
                      />
                      {fieldErrors.contactName && <span className="am-error-msg">{fieldErrors.contactName}</span>}
                    </div>
                    <div className="am-grid-2">
                      <div className="am-form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          placeholder={t('agency.merchants.form.emailPlaceholder')}
                          value={form.email}
                          onChange={e => setF('email', e.target.value)}
                          className={fieldErrors.email ? 'am-input--error' : ''}
                        />
                        {fieldErrors.email && <span className="am-error-msg">{fieldErrors.email}</span>}
                      </div>
                      <div className="am-form-group">
                        <label>{t('agency.merchants.form.phone')} <span className="am-optional">({t('agency.merchants.form.optional')})</span></label>
                        <div className={`am-phone-row${fieldErrors.phone ? ' am-input--error' : ''}`}>
                          <span className="am-phone-prefix">🇰🇼 +965</span>
                          <input
                            type="tel"
                            className="am-phone-input"
                            placeholder="XXXX XXXX"
                            maxLength={9}
                            value={form.phone}
                            onChange={e => setF('phone', e.target.value.replace(/[^\d\s]/g, ''))}
                          />
                        </div>
                        {fieldErrors.phone && <span className="am-error-msg">{fieldErrors.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Location */}
                  <div className="am-section">
                    <p className="am-section__title">
                      {t('agency.merchants.form.sectionLocation')} <span className="am-optional" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>({t('agency.merchants.form.optional')})</span>
                    </p>
                    <div className="am-grid-2" style={{ marginBottom: 10 }}>
                      <div className="am-form-group">
                        <label>{t('agency.merchants.form.city')}</label>
                        <input
                          type="text"
                          placeholder="ex. Kuwait City"
                          value={form.city}
                          onChange={e => setF('city', e.target.value)}
                        />
                      </div>
                      <div className="am-form-group">
                        <label>{t('agency.merchants.form.address')}</label>
                        <input
                          type="text"
                          placeholder="Rue, quartier"
                          value={form.address}
                          onChange={e => setF('address', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="am-grid-2">
                      <div className="am-form-group">
                        <label>{t('agency.merchants.form.latitude')}</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="29.3759"
                          value={form.lat}
                          onChange={e => setF('lat', e.target.value)}
                        />
                      </div>
                      <div className="am-form-group">
                        <label>{t('agency.merchants.form.longitude')}</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="47.9774"
                          value={form.lng}
                          onChange={e => setF('lng', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="am-picker-row">
                      <button
                        type="button"
                        className="ag-btn ag-btn--outline ag-btn--sm"
                        onClick={() => setPickerOpen(true)}
                      >
                        📍 {t('agency.merchants.form.pickOnMap')}
                      </button>
                      {form.lat && form.lng ? (
                        <span className="am-coords-badge am-coords-badge--set">
                          ✓ {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}
                        </span>
                      ) : (
                        <span className="am-coords-badge">{t('agency.merchants.form.noLocation')}</span>
                      )}
                    </div>
                  </div>

                  {/* Section 4: Commission */}
                  <div className="am-section" style={{ marginBottom: 0 }}>
                    <p className="am-section__title">{t('agency.merchants.form.sectionCommission')}</p>
                    <div className="am-form-group">
                      <label>{t('agency.merchants.form.commissionRate')}</label>
                      <div className="am-commission-wrap">
                        <div className="am-commission-value">
                          {form.commission}<span>%</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="range"
                            className="am-slider"
                            min={0} max={30} step={0.5}
                            value={form.commission}
                            style={{ '--pct': commissionPct } as React.CSSProperties}
                            onChange={e => setF('commission', parseFloat(e.target.value))}
                          />
                          <div className="am-slider-ticks">
                            {['0%', '5%', '10%', '15%', '20%', '25%', '30%'].map(t => (
                              <span key={t}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="am-modal__footer">
                    <button type="button" className="ag-btn ag-btn--outline" onClick={closeModal}>
                      {t('agency.merchants.form.cancel')}
                    </button>
                    <button type="submit" className="ag-btn ag-btn--primary" disabled={submitting}>
                      {submitting ? t('agency.merchants.form.creating') : t('agency.merchants.form.create')}
                    </button>
                  </div>
                </form>
              )}
      </BaseModal>

      {/* ══════════════════════════════════════════════════════════════════
          EDIT MODAL
          ══════════════════════════════════════════════════════════════ */}
      <BaseModal
        show={editModalOpen && !!editingMerchant}
        title={`✏️ ${t('agency.merchants.form.editTitle', { name: editingMerchant?.storeName ?? '' })}`}
        onClose={() => setEditModalOpen(false)}
        footer={
          <>
            <button type="button" className="ag-btn ag-btn--outline" onClick={() => setEditModalOpen(false)}>
              {t('agency.merchants.form.cancel')}
            </button>
            <button
              className="ag-btn ag-btn--primary"
              disabled={editLoading || !editForm.storeName.trim()}
              onClick={handleEditSubmit}
            >
              {editLoading ? t('agency.merchants.form.saving') : `💾 ${t('agency.merchants.form.save')}`}
            </button>
          </>
        }
      >
        {editError && <div className="ag-alert ag-alert--error">{editError}</div>}

              {/* Store name */}
              <div className="am-form-group" style={{ marginBottom: 14 }}>
                <label>{t('agency.merchants.form.storeName')} *</label>
                <input
                  type="text"
                  value={editForm.storeName}
                  onChange={e => setEditForm(p => ({ ...p, storeName: e.target.value }))}
                  placeholder={t('agency.merchants.form.storeName')}
                />
              </div>

              {/* Commission */}
              <div className="am-form-group" style={{ marginBottom: 14 }}>
                <label>{t('agency.merchants.form.commissionRate')} ({editForm.commission}%)</label>
                <div className="am-commission-wrap">
                  <div className="am-commission-value">
                    {editForm.commission}<span>%</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="range"
                      className="am-slider"
                      min={0} max={30} step={0.5}
                      value={editForm.commission}
                      style={{ '--pct': editCommPct } as React.CSSProperties}
                      onChange={e => setEditForm(p => ({ ...p, commission: parseFloat(e.target.value) }))}
                    />
                    <div className="am-slider-ticks">
                      {['0%', '5%', '10%', '15%', '20%', '25%', '30%'].map(t => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="am-form-group" style={{ marginBottom: 14 }}>
                <label>{t('agency.merchants.form.statusLabel')}</label>
                <select
                  value={editForm.isActive ? 'active' : 'inactive'}
                  onChange={e => setEditForm(p => ({ ...p, isActive: e.target.value === 'active' }))}
                >
                  <option value="active">✅ {t('agency.merchants.form.statusActive')}</option>
                  <option value="inactive">❌ {t('agency.merchants.form.statusInactive')}</option>
                </select>
              </div>

              {/* Address + City */}
              <div className="am-grid-2" style={{ marginBottom: 14 }}>
                <div className="am-form-group">
                  <label>{t('agency.merchants.form.address')}</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Rue, bâtiment..."
                  />
                </div>
                <div className="am-form-group">
                  <label>{t('agency.merchants.form.city')}</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Kuwait City, Salmiya..."
                  />
                </div>
              </div>

              {/* GPS location picker */}
              <div id="location-section" className="am-form-group" style={{ marginBottom: 4 }}>
                <label>{t('agency.merchants.form.gpsLabel')}</label>
                <div className="am-picker-row">
                  <button
                    type="button"
                    className="ag-btn ag-btn--outline ag-btn--sm"
                    onClick={() => setLocationPickerOpen(true)}
                  >
                    📍 {t('agency.merchants.form.pickOnMap')}
                  </button>
                  {editForm.lat !== null && editForm.lng !== null ? (
                    <span className="am-coords-badge am-coords-badge--set">
                      ✓ {editForm.lat.toFixed(4)}, {editForm.lng.toFixed(4)}
                    </span>
                  ) : (
                    <span className="am-coords-badge">{t('agency.merchants.form.noLocation')}</span>
                  )}
                </div>
              </div>
      </BaseModal>

      {/* Location picker — edit modal */}
      {locationPickerOpen && (
        <LocationPickerModal
          isOpen={locationPickerOpen}
          onClose={() => setLocationPickerOpen(false)}
          initialLat={editForm.lat ?? undefined}
          initialLng={editForm.lng ?? undefined}
          onConfirm={(lat, lng, address) => {
            const cityPart = address.split(',').find(part => isNaN(parseFloat(part.trim())))?.trim() || '';
            setEditForm(p => ({
              ...p,
              lat,
              lng,
              city: cityPart || p.city,
            }));
          }}
        />
      )}

      {/* Location picker — add modal */}
      {pickerOpen && (
        <LocationPickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          initialLat={form.lat ? parseFloat(form.lat) : undefined}
          initialLng={form.lng ? parseFloat(form.lng) : undefined}
          onConfirm={handlePickerConfirm}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          LOGO UPLOAD MODAL
          ══════════════════════════════════════════════════════════════ */}
      <BaseModal
        show={!!logoModal}
        title={`📷 ${t('agency.merchants.form.logoTitle', { name: logoModal?.storeName ?? '' })}`}
        onClose={() => setLogoModal(null)}
        maxWidth="420px"
        footer={
          <>
            <button className="ag-btn ag-btn--outline" onClick={() => setLogoModal(null)}>
              {t('agency.merchants.form.cancel')}
            </button>
            <button
              className="ag-btn ag-btn--primary"
              disabled={!logoPreview || logoUploading}
              onClick={handleLogoSave}
            >
              {logoUploading ? t('agency.merchants.form.logoSaving') : t('agency.merchants.form.logoSave')}
            </button>
          </>
        }
      >
        <div className="am-logo-upload-preview">
          {logoPreview ? (
            <img src={logoPreview} alt="preview" />
          ) : logoModal ? (
            <div
              className="am-logo-upload-placeholder"
              style={{ background: chipColor(logoModal.storeName) }}
            >
              {toInitials(logoModal.storeName)}
            </div>
          ) : null}
        </div>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onLogoFile}
        />

        <button
          type="button"
          className="ag-btn ag-btn--outline am-logo-choose-btn"
          onClick={() => logoInputRef.current?.click()}
        >
          📁 {t('agency.merchants.form.logoChoose')}
        </button>
      </BaseModal>

    </div>
  );
};

export default AgencyMerchants;
