// ============================================================
// APP — Root component with MVC routing
// ============================================================
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import AuthController from './controllers/auth.controller';
import PrivateRoute from './views/components/shared/PrivateRoute';

// ─── Lazy-loaded Views ───────────────────────────────────────
// Public
const Home            = lazy(() => import('./views/pages/public/Home'));
const Products        = lazy(() => import('./views/pages/public/Products'));
const Pricing         = lazy(() => import('./views/pages/public/Pricing'));
const Docs            = lazy(() => import('./views/pages/public/Docs'));
const Support         = lazy(() => import('./views/pages/public/Support'));
const Blog            = lazy(() => import('./views/pages/public/Blog'));
const TrackingPage    = lazy(() => import('./views/pages/public/TrackingPage'));
const TrackPage       = lazy(() => import('./views/pages/public/TrackPage'));

// Auth
const Login           = lazy(() => import('./views/pages/auth/Login'));
const Signup          = lazy(() => import('./views/pages/auth/Signup'));
const Register        = lazy(() => import('./views/pages/auth/Register'));
const LoginWithCode   = lazy(() => import('./views/pages/auth/LoginWithCode'));
const ForgotPassword  = lazy(() => import('./views/pages/auth/ForgotPassword'));
const ResetPassword   = lazy(() => import('./views/pages/auth/ResetPassword'));
const Impersonate     = lazy(() => import('./views/pages/auth/Impersonate'));

// Dashboard (Developer)
const Dashboard       = lazy(() => import('./views/pages/dashboard/Dashboard'));
const APIKeys         = lazy(() => import('./views/pages/developer/APIKeys'));
const Usage           = lazy(() => import('./views/pages/developer/Usage'));
const Logs            = lazy(() => import('./views/pages/developer/Logs'));
const Sandbox         = lazy(() => import('./views/pages/developer/Sandbox'));
const RoutingPage     = lazy(() => import('./views/pages/developer/RoutingPage'));
const Notifications   = lazy(() => import('./views/pages/developer/Notifications'));

// Merchant
const MerchantDashboard = lazy(() => import('./views/pages/merchant/MerchantDashboard'));
const MerchantOrders    = lazy(() => import('./views/pages/merchant/MerchantOrders'));
const CreateOrder       = lazy(() => import('./views/pages/merchant/CreateOrder'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
);

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sessionExpired } = useAppSelector((state) => state.auth);

  // Verify token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(AuthController.loadCurrentUser());
    }
  }, [dispatch]);

  // Handle session expiry
  useEffect(() => {
    if (sessionExpired) {
      window.location.href = '/login?expired=true';
    }
  }, [sessionExpired]);

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public Routes ─────────────────────────────── */}
          <Route path="/"                     element={<Home />} />
          <Route path="/products"             element={<Products />} />
          <Route path="/pricing"              element={<Pricing />} />
          <Route path="/docs"                 element={<Docs />} />
          <Route path="/support"              element={<Support />} />
          <Route path="/blog"                 element={<Blog />} />
          <Route path="/track"                element={<TrackingPage />} />
          <Route path="/track/:code"          element={<TrackPage />} />

          {/* ── Auth Routes ───────────────────────────────── */}
          <Route path="/login"                element={<Login />} />
          <Route path="/signup"               element={<Signup />} />
          <Route path="/register"             element={<Register />} />
          <Route path="/login-code"           element={<LoginWithCode />} />
          <Route path="/forgot-password"      element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/impersonate"          element={<Impersonate />} />

          {/* ── Merchant Routes ───────────────────────────── */}
          <Route element={<PrivateRoute allowedRoles={['merchant']} />}>
            <Route path="/merchant/dashboard"  element={<MerchantDashboard />} />
            <Route path="/merchant/orders"     element={<MerchantOrders />} />
            <Route path="/merchant/orders/new" element={<CreateOrder />} />
          </Route>

          {/* ── Protected Routes (all authenticated users) ── */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard/*"              element={<Dashboard />} />
            <Route path="/agency/*"                 element={<Dashboard />} />
            <Route path="/client/*"                 element={<Dashboard />} />
            <Route path="/driver/*"                 element={<Dashboard />} />
            <Route path="/developer/dashboard/*"    element={<Dashboard />} />
            <Route path="/api-keys"                 element={<APIKeys />} />
            <Route path="/usage"                    element={<Usage />} />
            <Route path="/logs"                     element={<Logs />} />
            <Route path="/sandbox"                  element={<Sandbox />} />
            <Route path="/routing"                  element={<RoutingPage />} />
            <Route path="/notifications"            element={<Notifications />} />
            <Route path="/notifications/:id"        element={<Notifications />} />
          </Route>

          {/* ── Fallback ──────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
