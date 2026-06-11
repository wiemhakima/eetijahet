// ============================================================
// APP — Root component MVC (React 19 + TypeScript)
// ============================================================
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import AuthController from './controllers/auth.controller';
import PrivateRoute from './views/components/shared/PrivateRoute';

// ─── Public ──────────────────────────────────────────────────
const Home           = lazy(() => import('./pages/Home/Home'));
const Products       = lazy(() => import('./pages/Products/Products'));
const Pricing        = lazy(() => import('./pages/Pricing/Pricing'));
const Docs           = lazy(() => import('./pages/Docs/Docs'));
const Support        = lazy(() => import('./pages/Support/Support'));
const Blog           = lazy(() => import('./pages/Blog/Blog'));
const TrackingPage   = lazy(() => import('./pages/TrackingPage/TrackingPage'));

// ─── Auth ─────────────────────────────────────────────────────
const Login          = lazy(() => import('./pages/Login/Login'));
const Signup         = lazy(() => import('./pages/Signup/Signup'));
const Register       = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword/ResetPassword'));
const Impersonate    = lazy(() => import('./pages/Impersonate/Impersonate'));

// ─── App ──────────────────────────────────────────────────────
const Dashboard      = lazy(() => import('./pages/Dashboard/Dashboard'));
const APIKeys        = lazy(() => import('./pages/APIKeys/APIKeys'));
const Usage          = lazy(() => import('./pages/Usage/Usage'));
const Sandbox        = lazy(() => import('./pages/Sandbox/Sandbox'));
const Notifications  = lazy(() => import('./pages/Notifications/Notifications'));
const RoutingPage    = lazy(() => import('./pages/RoutingPage'));

// ─── Merchant ─────────────────────────────────────────────────
const MerchantDashboard = lazy(() => import('./pages/merchant/MerchantDashboard/MerchantDashboard'));
const MerchantOrders    = lazy(() => import('./pages/merchant/MerchantOrders/MerchantOrders'));
const CreateOrder       = lazy(() => import('./pages/merchant/CreateOrder/CreateOrder'));

// Loading
const PageLoader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
    <div style={{ width:48, height:48, border:'4px solid #e5e7eb', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
  </div>
);

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessionExpired } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) dispatch(AuthController.loadCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (sessionExpired) window.location.href = '/login?expired=true';
  }, [sessionExpired]);

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/"                      element={<Home />} />
          <Route path="/products"              element={<Products />} />
          <Route path="/pricing"               element={<Pricing />} />
          <Route path="/docs"                  element={<Docs />} />
          <Route path="/support"               element={<Support />} />
          <Route path="/blog"                  element={<Blog />} />
          <Route path="/track"                 element={<TrackingPage />} />
          <Route path="/track/:code"           element={<TrackingPage />} />

          {/* Auth */}
          <Route path="/login"                 element={<Login />} />
          <Route path="/signup"                element={<Signup />} />
          <Route path="/register"              element={<Register />} />
          <Route path="/forgot-password"       element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/impersonate"           element={<Impersonate />} />

          {/* Merchant */}
          <Route element={<PrivateRoute allowedRoles={['merchant']} />}>
            <Route path="/merchant/dashboard"  element={<MerchantDashboard />} />
            <Route path="/merchant/orders"     element={<MerchantOrders />} />
            <Route path="/merchant/orders/new" element={<CreateOrder />} />
          </Route>

          {/* Protected */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard/*"             element={<Dashboard />} />
            <Route path="/agency/*"                element={<Dashboard />} />
            <Route path="/client/*"                element={<Dashboard />} />
            <Route path="/driver/*"                element={<Dashboard />} />
            <Route path="/developer/dashboard/*"   element={<Dashboard />} />
            <Route path="/api-keys"                element={<APIKeys />} />
            <Route path="/usage"                   element={<Usage />} />
            <Route path="/sandbox"                 element={<Sandbox />} />
            <Route path="/routing"                 element={<RoutingPage />} />
            <Route path="/notifications"           element={<Notifications />} />
            <Route path="/notifications/:id"       element={<Notifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
