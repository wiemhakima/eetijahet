import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchApiKeys } from '../../store/slices/apiKeySlice';
import { fetchUsageData } from '../../store/slices/usageSlice';
import { fetchSubscription } from '../../store/slices/agencySlice';
import { StatCardSkeleton } from '../../components/Skeleton';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UsageWidget from './components/UsageWidget';
import QuickActionsWidget from './components/QuickActionsWidget';
import APIKeys from '../APIKeys';
import CreateAPI from '../APIKeys/CreateAPI';
import ServiceProfile from '../APIKeys/ServiceProfile';
import Usage from '../Usage';
import Logs from '../Logs';
import Sandbox from '../Sandbox';
import Notifications from '../Notifications';
import Documentation from '../Documentation';
import Billing from '../Billing';
import AdminUsers from '../Admin/AdminUsers';
import AdminNotifications from '../Admin/AdminNotifications';
import AdminDashboard from '../Admin/AdminDashboard';
import RoadGraph from '../Admin/RoadGraph/RoadGraph';
import Settings from '../Settings';
import ClientDashboard from '../ClientDashboard';
import NewDelivery from '../NewDelivery';
import OrdersPage from '../OrdersPage';
import TrackingPage from '../TrackingPage';
import AddressesPage from '../AddressesPage';
import AgencyDashboard from '../Agency/AgencyDashboard/AgencyDashboard';
import AgencyDeliveries from '../Agency/AgencyDeliveries/AgencyDeliveries';
import AgencySubscription from '../Agency/AgencySubscription/AgencySubscription';
import AgencyCheckout from '../Agency/AgencySubscription/AgencyCheckout';
import AgencyMerchants from '../Agency/AgencyMerchants/AgencyMerchants';
import AgencyStatistics from '../Agency/AgencyStatistics/AgencyStatistics';
import AgencyFinances from '../Agency/AgencyFinances/AgencyFinances';
import AgencySettings from '../Agency/Settings/Settings';
import ClientNewDelivery from '../Client/ClientNewDelivery';
import ClientDeliveryDetails from '../ClientDeliveryDetails/ClientDeliveryDetails';
import './Dashboard.scss';

// Placeholder for pages not yet implemented
const ComingSoon: React.FC<{ title: string }> = ({ title }) => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px', color: '#545b64' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#16191f', margin: 0 }}>{title}</h2>
      <p style={{ fontSize: '14px', margin: 0, textAlign: 'center' }}>{t('dashboard.comingSoonFeature')}</p>
    </div>
  );
};

// Simple flat icons
const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
    <polyline points="17,6 23,6 23,12" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <polyline points="12,5 19,12 12,19" />
  </svg>
);

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const isAgency = path.startsWith('/agency');
  const isClient = path.startsWith('/client');
  const basePath = isAgency ? '/agency'
    : isClient ? '/client'
    : path.startsWith('/developer/dashboard') ? '/developer/dashboard'
    : '/dashboard';
  
  // Get data from Redux store
  const { apiKeys, isLoading: apiKeysLoading } = useAppSelector(state => state.apiKeys);
  const { data: usageData, isLoading: usageLoading } = useAppSelector(state => state.usage);
  const { user } = useAppSelector(state => state.auth);
  
  // Determine if stats are still loading (initial load)
  const isStatsLoading = (usageLoading && !usageData) || (apiKeysLoading && apiKeys.length === 0);
  
  // Fetch data when component mounts or when returning to dashboard home
  useEffect(() => {
    dispatch(fetchApiKeys());
    dispatch(fetchUsageData('7days'));
    if (isAgency) {
      dispatch(fetchSubscription());
    }
  }, [dispatch, isAgency]);
  
  // Refresh data when navigating back to dashboard home
  useEffect(() => {
    if (path === '/dashboard' || path === '/dashboard/') {
      dispatch(fetchUsageData('7days'));
    }
  }, [dispatch, path]);
  
  // Determine active nav based on current path
  const getActiveNav = () => {
    // Agency admin paths (clean URLs: /agency/drivers etc.)
    if (path === '/agency' || path === '/agency/')    return 'dashboard';
    if (path.includes('/agency/deliveries'))          return 'ag-deliveries';
    if (path.includes('/agency/subscription'))        return 'ag-subscription';
    if (path.includes('/agency/merchants'))           return 'ag-merchants';
    if (path.includes('/agency/statistics'))          return 'ag-statistics';
    if (path.includes('/agency/finances'))            return 'ag-finances';
    if (path.includes('/agency/settings'))            return 'settings';
    // Client paths
    if (path === '/client' || path === '/client/')    return 'dashboard';
    if (path.includes('/client/new-delivery'))        return 'new-delivery';
    if (path.includes('/client/deliveries'))          return 'deliveries';
    if (path.includes('/client/addresses'))           return 'addresses';
    if (path.includes('/dashboard/api-keys')) return 'api-keys';
    if (path.includes('/dashboard/usage')) return 'usage';
    if (path.includes('/dashboard/logs')) return 'logs';
    if (path.includes('/dashboard/notifications')) return 'notifications';
    if (path.includes('/dashboard/sandbox')) return 'sandbox';
    if (path.includes('/dashboard/billing')) return 'billing';
    if (path.includes('/dashboard/docs')) return 'docs';
    if (path.includes('/dashboard/settings')) return 'settings';
    if (path.includes('/dashboard/admin-users')) return 'admin-users';
    if (path.includes('/dashboard/admin-notifications')) return 'admin-notifications';
    if (path.includes('/dashboard/admin-road-graph')) return 'admin-road-graph';
    if (path.includes('/dashboard/new-delivery')) return 'new-delivery';
    if (path.includes('/dashboard/orders'))       return 'orders';
    if (path.includes('/dashboard/tracking'))     return 'tracking';
    if (path.includes('/dashboard/addresses'))      return 'addresses';
    if (path.includes('/dashboard/client-history'))  return 'client-history';
    return 'dashboard';
  };
  
  const [activeNav, setActiveNav] = useState(getActiveNav());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Update active nav when path changes
  useEffect(() => {
    setActiveNav(getActiveNav());
  }, [path]);

  // Scroll to top when route/section changes
  useEffect(() => {
    // Scroll the window to top
    window.scrollTo(0, 0);
    // Also scroll any scrollable dashboard containers to top
    const contentEl = document.querySelector('.dashboard-content');
    if (contentEl) {
      contentEl.scrollTop = 0;
    }
    const mainEl = document.querySelector('.dashboard-main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [location.pathname]);

  // Handle navigation when sidebar item is clicked
  const handleNavChange = (nav: string) => {
    setActiveNav(nav);

    // Agency admin navigation — clean URLs
    if (isAgency) {
      const agencyNavMap: Record<string, string> = {
        'dashboard':       '/agency',

        'ag-deliveries':   '/agency/deliveries',
        'ag-subscription': '/agency/subscription',
        'ag-merchants':    '/agency/merchants',
        'ag-statistics':   '/agency/statistics',
        'ag-finances':     '/agency/finances',
        'settings':        '/agency/settings',
      };
      if (nav in agencyNavMap) { navigate(agencyNavMap[nav]); return; }
    }

    // Client navigation
    if (isClient) {
      const clientNavMap: Record<string, string> = {
        'dashboard':    '/client',
        'new-delivery': '/client/new-delivery',
        'deliveries':   '/client/deliveries',
        'addresses':    '/client/addresses',
        'settings':     '/client/settings',
        'profile':      '/client/settings',
      };
      if (nav in clientNavMap) { navigate(clientNavMap[nav]); return; }
    }

    switch(nav) {
      case 'dashboard':
        navigate(basePath);
        break;
      case 'api-keys':
        navigate(`${basePath}/api-keys`);
        break;
      case 'usage':
        navigate(`${basePath}/usage`);
        break;
      case 'logs':
        navigate(`${basePath}/logs`);
        break;
      case 'notifications':
        navigate(`${basePath}/notifications`);
        break;
      case 'sandbox':
        navigate(`${basePath}/sandbox`);
        break;
      case 'billing':
        navigate(`${basePath}/billing`);
        break;
      case 'docs':
        navigate(`${basePath}/docs`);
        break;
      case 'settings':
        navigate(`${basePath}/settings`);
        break;
      case 'profile':
        navigate(`${basePath}/profile`);
        break;
      case 'addresses':
        navigate(`${basePath}/addresses`);
        break;
      case 'admin-users':
        navigate(`${basePath}/admin-users`);
        break;
      case 'admin-notifications':
        navigate(`${basePath}/admin-notifications`);
        break;
      case 'admin-road-graph':
        navigate(`${basePath}/admin-road-graph`);
        break;
      case 'new-delivery':
        navigate(`${basePath}/new-delivery`);
        break;
      case 'orders':
        navigate(`${basePath}/orders`);
        break;
      case 'tracking':
        navigate(`${basePath}/tracking`);
        break;
      case 'client-history':
        navigate(`${basePath}/client-history`);
        break;
      default:
        navigate(basePath);
    }
  };

  // Get summary stats for welcome section
  const getSummaryStats = () => {
    if (!usageData) return {
      totalRequests: '0',
      successRate: '0%',
      creditsUsed: '0',
      activeKeys: 0
    };
    
    return {
      totalRequests: usageData.requests.total.toLocaleString(),
      successRate: `${usageData.requests.successRate}%`,
      creditsUsed: usageData.credits.used.toLocaleString(),
      activeKeys: apiKeys.filter(key => key.status === 'active').length
    };
  };
  
  const stats = getSummaryStats();
  
  // Get username from user object
  const getUserName = () => {
    if (!user) return 'User';
    return `${user.firstName} ${user.lastName}`;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar activeNav={activeNav} setActiveNav={handleNavChange} />

      {/* Main content */}
      <main className="dashboard-main">
        {/* Header */}
        <Header 
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
        />

        {/* Dashboard content */}
        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={
              (user?.role === 'agency_admin' || user?.role === 'gestionnaire_agency') ? <AgencyDashboard /> :
              user?.role === 'user'   ? <ClientDashboard /> :
              user?.role === 'admin'  ? <AdminDashboard /> : (
              <div className="dashboard-home">
                {/* Welcome Banner */}
                <div className="aws-welcome">
                  <div className="aws-welcome__text">
                    <h1 className="aws-welcome__title">{t('dashboard.dev.welcome', { name: getUserName() })}</h1>
                    <p className="aws-welcome__subtitle">{t('dashboard.dev.subtitle')}</p>
                  </div>
                  <div className="aws-welcome__actions">
                    <button className="aws-btn aws-btn--primary" onClick={() => navigate('/dashboard/sandbox')}>
                      <ZapIcon />
                      {t('dashboard.dev.sandbox')}
                    </button>
                    <button className="aws-btn aws-btn--outline" onClick={() => navigate('/dashboard/docs')}>
                      {t('dashboard.dev.viewDocs')}
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="aws-stats">
                  {isStatsLoading ? (
                    <>
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                    </>
                  ) : (
                    <>
                      <div className="aws-stat-card">
                        <div className="aws-stat-card__header">
                          <span className="aws-stat-card__icon aws-stat-card__icon--blue">
                            <TrendingUpIcon />
                          </span>
                          <span className="aws-stat-card__label">{t('dashboard.dev.totalRequests')}</span>
                        </div>
                        <div className="aws-stat-card__value">{stats.totalRequests}</div>
                        <div className="aws-stat-card__change aws-stat-card__change--positive">
                          {t('dashboard.dev.weeklyTrend')}
                        </div>
                      </div>

                      <div className="aws-stat-card">
                        <div className="aws-stat-card__header">
                          <span className="aws-stat-card__icon aws-stat-card__icon--green">
                            <ShieldCheckIcon />
                          </span>
                          <span className="aws-stat-card__label">{t('dashboard.dev.successRate')}</span>
                        </div>
                        <div className="aws-stat-card__value">{stats.successRate}</div>
                        <div className="aws-stat-card__change aws-stat-card__change--positive">
                          {t('dashboard.dev.dailyTrend')}
                        </div>
                      </div>

                      <div className="aws-stat-card">
                        <div className="aws-stat-card__header">
                          <span className="aws-stat-card__icon aws-stat-card__icon--orange">
                            <ZapIcon />
                          </span>
                          <span className="aws-stat-card__label">{t('dashboard.dev.creditsUsed')}</span>
                        </div>
                        <div className="aws-stat-card__value">{stats.creditsUsed}</div>
                        <div className="aws-stat-card__change aws-stat-card__change--neutral">
                          {t('dashboard.dev.remaining', { count: 2450 })}
                        </div>
                      </div>

                      <div className="aws-stat-card">
                        <div className="aws-stat-card__header">
                          <span className="aws-stat-card__icon aws-stat-card__icon--teal">
                            <ActivityIcon />
                          </span>
                          <span className="aws-stat-card__label">{t('dashboard.dev.activeKeys')}</span>
                        </div>
                        <div className="aws-stat-card__value">{stats.activeKeys}</div>
                        <div className="aws-stat-card__change aws-stat-card__change--neutral">
                          {t('dashboard.dev.allSystemsOk')}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Widgets Grid */}
                <div className="aws-widgets">
                  {/* Usage Analytics Widget */}
                  <div className="aws-widget aws-widget--large">
                    <div className="aws-widget__header">
                      <div className="aws-widget__title-group">
                        <h3 className="aws-widget__title">{t('dashboard.dev.usageTitle')}</h3>
                        <p className="aws-widget__desc">{t('dashboard.dev.usageDesc')}</p>
                      </div>
                      <button className="aws-link-btn" onClick={() => navigate('/dashboard/usage')}>
                        {t('dashboard.dev.viewDetails')}
                        <ArrowRightIcon />
                      </button>
                    </div>
                    <div className="aws-widget__body">
                      <UsageWidget />
                    </div>
                  </div>

                  {/* Quick Actions Widget */}
                  <div className="aws-widget aws-widget--side">
                    <div className="aws-widget__header">
                      <div className="aws-widget__title-group">
                        <h3 className="aws-widget__title">{t('dashboard.dev.quickActions')}</h3>
                        <p className="aws-widget__desc">{t('dashboard.dev.quickActionsDesc')}</p>
                      </div>
                    </div>
                    <div className="aws-widget__body">
                      <QuickActionsWidget />
                    </div>
                  </div>
                </div>
              </div>
              )
            } />
            <Route path="/api-keys" element={<APIKeys />} />
            <Route path="/api-keys/create" element={<CreateAPI />} />
            <Route path="/api-keys/create/services" element={<CreateAPI />} />
            <Route path="/api-keys/service/:slug" element={<ServiceProfile />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/notifications/:id" element={<Notifications />} />
            <Route path="/sandbox" element={<Sandbox />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/settings" element={(user?.role === 'agency_admin' || user?.role === 'gestionnaire_agency') ? <AgencySettings /> : <Settings />} />
            <Route path="/profile" element={<Settings />} />
            {/* Admin Routes */}
            <Route path="/admin-users" element={<AdminUsers />} />
            <Route path="/admin-notifications" element={<AdminNotifications />} />
            <Route path="/admin-road-graph" element={<RoadGraph />} />
            {/* Client Routes */}
            <Route path="/new-delivery" element={<NewDelivery />} />
            <Route path="/orders"       element={<OrdersPage />} />
            <Route path="/tracking"     element={<TrackingPage />} />
            <Route path="/addresses"    element={<AddressesPage />} />
            {/* Agency Admin Routes — clean URLs under /agency/* */}
            <Route path="/deliveries"   element={<AgencyDeliveries />} />
            <Route path="/subscription" element={<AgencySubscription />} />
            <Route path="/subscription/checkout" element={<AgencyCheckout />} />
            <Route path="/merchants"    element={<AgencyMerchants />} />
            <Route path="/statistics"   element={<AgencyStatistics />} />
            <Route path="/finances"     element={<AgencyFinances />} />
            {/* Client marketplace routes — under /client/* */}
            <Route path="/new-delivery"        element={<ClientNewDelivery />} />
            <Route path="/deliveries"          element={<OrdersPage />} />
            <Route path="/deliveries/:id"      element={<ClientDeliveryDetails />} />
            <Route path="/addresses"           element={<AddressesPage />} />
            {/* Role-specific pages */}
            <Route path="/client-history"  element={<ComingSoon title={t('dashboard.clientHistory')} />} />
            <Route path="*" element={<div className="dashboard-message">{t('dashboard.pageNotFound')}</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
