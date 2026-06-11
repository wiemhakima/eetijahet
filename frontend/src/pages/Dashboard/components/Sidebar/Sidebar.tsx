import './Sidebar.scss';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Map as LucideMap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import Avatar from '../../../../components/Avatar';
import { logoutUser } from '../../../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

// ─── Agency emoji icons (module-level — stable references, no remount) ────────

const Emoji = ({ e }: { e: string }) => (
  <span style={{ fontSize: 18, lineHeight: 1 }}>{e}</span>
);

const AgDashboardIcon    = () => <Emoji e="📊" />;
const AgMerchantsIcon    = () => <Emoji e="🏪" />;
const AgDeliveriesIcon   = () => <Emoji e="📦" />;
const AgDriversIcon      = () => <Emoji e="🚚" />;
const AgStatisticsIcon   = () => <Emoji e="📈" />;
const AgFinancesIcon     = () => <Emoji e="💰" />;
const AgSubscriptionIcon = () => <Emoji e="💳" />;
const AgSettingsIcon     = () => <Emoji e="⚙️" />;

// ─── Refined SVG Icons (stroke-based for modern feel) ───────────────────────

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

const APIKeysIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const UsageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const LogsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const NotificationsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const BillingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const SandboxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16,18 22,12 16,6" />
    <polyline points="8,6 2,12 8,18" />
    <line x1="14" y1="4" x2="10" y2="20" />
  </svg>
);

const DriverIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1.5" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const DriverRequestsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const MesLivraisonsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);

const DocsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="13" y2="11" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
  >
    <polyline points="11,17 6,12 11,7" />
    <polyline points="18,17 13,12 18,7" />
  </svg>
);

// Admin Icons
const NewDeliveryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const MyOrdersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const LiveTrackingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const FavoriteAddressIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" />
  </svg>
);

const ProfileNavIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const RoadGraphIcon = () => <LucideMap width={20} height={20} strokeWidth={1.75} />;

const AdminUsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const AdminNotifIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const EarningsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const StatisticsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </svg>
);

const FinancesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ─── Tooltip Component ──────────────────────────────────────────────────────

interface TooltipProps {
  text: string;
  show: boolean;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, show, children }) => (
  <div className="sidebar-tooltip-wrapper">
    {children}
    {show && <div className="sidebar-tooltip">{text}</div>}
  </div>
);

// ─── Props ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

// ─── Main Sidebar Component ─────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({ activeNav, setActiveNav }) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user } = useAppSelector(state => state.auth);
  const notifications = useAppSelector(state => state.notifications);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const { subscription: agencySubscription } = useAppSelector(state => state.agency);
  const agencyPlan = (agencySubscription?.plan ?? 'basic') as 'basic' | 'medium' | 'pro';

  const userRole        = user?.role || 'user';
  const isAdmin         = userRole === 'admin';
  const pureUser        = userRole === 'user';
  const pureDev         = userRole === 'developer';
  const isAgencyAdmin   = userRole === 'agency_admin';
  const isGestionnaire  = userRole === 'gestionnaire_agency';
  const pureAgencyAdmin = isAgencyAdmin || isGestionnaire;

  const mainNavItems = [
    ...(pureAgencyAdmin ? [] : [
      { id: 'dashboard', label: isAdmin ? t('sidebar.dashboardAdmin') : t('sidebar.dashboard'), icon: DashboardIcon },
    ]),
    // Agency Admin — principal: only dashboard
    ...(pureAgencyAdmin ? [
      { id: 'dashboard', label: t('sidebar.agDashboard'), icon: AgDashboardIcon },
    ] : []),
    // Client (role: 'user') — Kuwait marketplace
    ...(pureUser ? [
      { id: 'new-delivery', label: t('sidebar.newDelivery'), icon: NewDeliveryIcon },
      { id: 'deliveries',   label: t('sidebar.myOrders'),   icon: MyOrdersIcon },
    ] : []),
    // Developer
    ...(pureDev ? [
      { id: 'api-keys', label: t('sidebar.apiKeys'), icon: APIKeysIcon },
      { id: 'usage',    label: t('sidebar.usage'),   icon: UsageIcon },
      { id: 'logs',     label: t('sidebar.logs'),    icon: LogsIcon },
    ] : []),
    // Admin
    ...(isAdmin ? [
      { id: 'admin-users', label: t('sidebar.adminUsers'), icon: AdminUsersIcon },
    ] : []),
    ...(!pureAgencyAdmin ? [
      { id: 'notifications', label: t('sidebar.notifications'), icon: NotificationsIcon, badge: notifications.unreadCount > 0 ? notifications.unreadCount : undefined },
    ] : []),
  ];

  // Agency Admin — Gestion section (drivers, deliveries, merchants — no clients)
  const gestionNavItems = pureAgencyAdmin ? [
    { id: 'ag-merchants',  label: t('sidebar.agMerchants'),  icon: AgMerchantsIcon  },
    { id: 'ag-deliveries', label: t('sidebar.agDeliveries'), icon: AgDeliveriesIcon },
  ] : [];

  const analyticsNavItems = pureAgencyAdmin ? [
    {
      id:     'ag-statistics',
      label:  t('sidebar.agStatistics'),
      icon:   AgStatisticsIcon,
      locked: isGestionnaire ? false : agencyPlan === 'basic',
    },
    {
      id:     'ag-finances',
      label:  t('sidebar.agFinances'),
      icon:   AgFinancesIcon,
      locked: isGestionnaire ? false : (agencyPlan === 'basic' || agencyPlan === 'medium'),
    },
  ] : [];

  const toolsNavItems = [
    // Client tools — Kuwait marketplace
    ...(pureUser ? [
      { id: 'addresses', label: t('sidebar.addresses'), icon: FavoriteAddressIcon },
      { id: 'settings',  label: t('sidebar.settings'),  icon: SettingsIcon },
    ] : []),
    // Developer tools
    ...(pureDev ? [
      { id: 'sandbox', label: t('sidebar.sandbox'), icon: SandboxIcon },
      { id: 'billing', label: t('sidebar.billing'), icon: BillingIcon },
      { id: 'docs',    label: t('sidebar.docs'),    icon: DocsIcon },
    ] : []),
    // Admin tools
    ...(isAdmin ? [
      { id: 'settings',         label: t('sidebar.settings'), icon: SettingsIcon },
      { id: 'admin-road-graph', label: t('sidebar.adminRoadGraph'), icon: RoadGraphIcon },
    ] : []),
    // Agency Admin tools — Paramètres and Abonnement restricted to agency owner
    ...(isAgencyAdmin ? [
      { id: 'ag-subscription', label: t('sidebar.agSubscription'), icon: AgSubscriptionIcon },
      { id: 'settings',        label: t('sidebar.agSettings'),     icon: AgSettingsIcon },
    ] : []),
  ];

  const adminNavItems = [
    { id: 'admin-notifications', label: t('sidebar.adminNotifications'), icon: AdminNotifIcon },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setShowUserMenu(false);
  };

  const renderNavItem = (item: { id: string; label: string; icon: React.FC; badge?: number; locked?: boolean }, isAdmin = false) => {
    const IconComponent = item.icon;
    const isActive  = activeNav === item.id;
    const isHovered = hoveredItem === item.id;
    const isLocked  = item.locked ?? false;

    return (
      <li key={item.id}>
        <Tooltip text={isLocked ? `${item.label} — Upgrade requis` : item.label} show={isCollapsed && isHovered}>
          <button
            className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isAdmin ? 'admin' : ''} ${isLocked ? 'locked' : ''}`}
            onClick={() => !isLocked && setActiveNav(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            title={isLocked ? `Upgrade requis` : undefined}
          >
            <span className="sidebar-nav-item__indicator" />
            <span className="sidebar-nav-item__icon">
              <IconComponent />
            </span>
            {!isCollapsed && (
              <span className="sidebar-nav-item__label">{item.label}</span>
            )}
            {!isCollapsed && item.badge && !isLocked && (
              <span className="sidebar-nav-item__badge">{item.badge > 99 ? '99+' : item.badge}</span>
            )}
            {isCollapsed && item.badge && !isLocked && (
              <span className="sidebar-nav-item__badge-dot" />
            )}
            {!isCollapsed && isLocked && (
              <span className="sidebar-nav-item__lock"><LockIcon /></span>
            )}
          </button>
        </Tooltip>
      </li>
    );
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sidebar__header">
        <div className="sidebar__logo" onClick={() => setActiveNav('dashboard')}>
          <div className="sidebar__logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1a73e8" opacity="0.9"/>
              <path d="M2 17L12 22L22 17" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!isCollapsed && (
            <span className="sidebar__logo-text">Etijahat</span>
          )}
        </div>
        <button 
          className="sidebar__collapse-btn" 
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <CollapseIcon collapsed={isCollapsed} />
        </button>
      </div>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="sidebar__nav">
        {/* Main Section */}
        <div className="sidebar__section">
          {!isCollapsed && <span className="sidebar__section-label">{t('sidebar.sectionMain')}</span>}
          <ul className="sidebar__nav-list">
            {mainNavItems.map(item => renderNavItem(item))}
          </ul>
        </div>

        {/* Gestion Section — agency_admin only */}
        {gestionNavItems.length > 0 && (
          <div className="sidebar__section">
            {!isCollapsed && <span className="sidebar__section-label">{t('sidebar.sectionGestion')}</span>}
            {isCollapsed && <div className="sidebar__section-divider" />}
            <ul className="sidebar__nav-list">
              {gestionNavItems.map(item => renderNavItem(item))}
            </ul>
          </div>
        )}

        {/* Analytics Section — agency_admin only, plan-gated */}
        {analyticsNavItems.length > 0 && (
          <div className="sidebar__section">
            {!isCollapsed && <span className="sidebar__section-label">{t('sidebar.sectionAnalytics')}</span>}
            {isCollapsed && <div className="sidebar__section-divider" />}
            <ul className="sidebar__nav-list">
              {analyticsNavItems.map(item => renderNavItem(item))}
            </ul>
          </div>
        )}

        {/* Tools Section — only render when there are tools for this role */}
        {toolsNavItems.length > 0 && (
          <div className="sidebar__section">
            {!isCollapsed && <span className="sidebar__section-label">{t('sidebar.sectionTools')}</span>}
            {isCollapsed && <div className="sidebar__section-divider" />}
            <ul className="sidebar__nav-list">
              {toolsNavItems.map(item => renderNavItem(item))}
            </ul>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <div className="sidebar__section sidebar__section--admin">
            {!isCollapsed && (
              <span className="sidebar__section-label sidebar__section-label--admin">
                <ShieldIcon />
                {t('sidebar.sectionAdmin')}
              </span>
            )}
            {isCollapsed && <div className="sidebar__section-divider sidebar__section-divider--admin" />}
            <ul className="sidebar__nav-list">
              {adminNavItems.map(item => renderNavItem(item, true))}
            </ul>
          </div>
        )}
      </nav>

      {/* ── Footer / User Profile ───────────────────────────────── */}
      <div className="sidebar__footer" ref={userMenuRef}>
        {/* User Dropdown Menu */}
        {showUserMenu && (
          <div className={`sidebar__user-menu ${isCollapsed ? 'sidebar__user-menu--collapsed' : ''}`}>
            <div className="sidebar__user-menu-header">
              <Avatar 
                firstName={user?.firstName} 
                lastName={user?.lastName} 
                size="large"
              />
              <div className="sidebar__user-menu-info">
                <span className="sidebar__user-menu-name">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                </span>
                <span className="sidebar__user-menu-email">
                  {user ? user.email : 'guest@etijahat.com'}
                </span>
              </div>
            </div>
            <div className="sidebar__user-menu-divider" />
            <button 
              className="sidebar__user-menu-item"
              onClick={() => { setActiveNav('profile'); setShowUserMenu(false); }}
            >
              <UserIcon />
              <span>{t('dashboardHeader.profileSettings')}</span>
            </button>
            <button
              className="sidebar__user-menu-item"
              onClick={() => { setActiveNav('settings'); setShowUserMenu(false); }}
            >
              <SettingsIcon />
              <span>{t('sidebar.settings')}</span>
            </button>
            <div className="sidebar__user-menu-divider" />
            <button
              className="sidebar__user-menu-item sidebar__user-menu-item--danger"
              onClick={handleLogout}
            >
              <LogoutIcon />
              <span>{t('dashboardHeader.signOut')}</span>
            </button>
          </div>
        )}

        <button 
          className={`sidebar__user-btn ${showUserMenu ? 'sidebar__user-btn--active' : ''}`}
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="sidebar__user-avatar">
            <Avatar 
              firstName={user?.firstName} 
              lastName={user?.lastName} 
              size="medium"
            />
          </div>
          {!isCollapsed && (
            <>
              <div className="sidebar__user-details">
                <span className="sidebar__user-name">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
                </span>
                <span className="sidebar__user-role">
                  {isAdmin ? t('sidebar.roleAdmin') : pureDev ? t('sidebar.roleDeveloper') : isAgencyAdmin ? t('sidebar.roleAgencyAdmin') : isGestionnaire ? t('sidebar.roleGestionnaire') : t('sidebar.roleClient')}
                </span>
              </div>
              <span className={`sidebar__user-chevron ${showUserMenu ? 'sidebar__user-chevron--open' : ''}`}>
                <ChevronIcon />
              </span>
            </>
          )}
          {isCollapsed && (
            <span className="sidebar__user-more">
              <MoreIcon />
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
