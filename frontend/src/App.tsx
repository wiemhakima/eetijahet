import './App.css';

import React, { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import APIKeys from './pages/APIKeys';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Impersonate from './pages/Impersonate';
import Login from './pages/Login';
import { Register } from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import MerchantDashboard from './pages/merchant/MerchantDashboard/MerchantDashboard';
import MerchantOrders from './pages/merchant/MerchantOrders/MerchantOrders';
import CreateOrder from './pages/merchant/CreateOrder/CreateOrder';
import Logs from './pages/Logs';
import MapView from './pages/Dashboard/components/MapView';
import Notifications from './pages/Notifications';
import PrivateRoute from './components/PrivateRoute';
import RoutingPage from './pages/RoutingPage';
import Sandbox from './pages/Sandbox';
import Signup from './pages/Signup';
import Usage from './pages/Usage';
import Products from './pages/Products/Products';
import Pricing from './pages/Pricing/Pricing';
import Docs from './pages/Docs/Docs';
import Support from './pages/Support/Support';
import Blog from './pages/Blog/Blog';
import { getCurrentUser } from './store/slices/authSlice';
import { useAppDispatch } from './store/hooks';

const App: React.FC = () => {
  const dispatch = useAppDispatch();

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/support" element={<Support />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/impersonate" element={<Impersonate />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/routing" element={<RoutingPage />} />
          {/* Merchant routes */}
          <Route element={<PrivateRoute allowedRoles={['merchant']} />}>
            <Route path="/merchant/dashboard"  element={<MerchantDashboard />} />
            <Route path="/merchant/orders"     element={<MerchantOrders />} />
            <Route path="/merchant/orders/new" element={<CreateOrder />} />
          </Route>
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/agency/*" element={<Dashboard />} />
            <Route path="/client/*" element={<Dashboard />} />
            <Route path="/developer/dashboard/*" element={<Dashboard />} />
            <Route path="/api-keys" element={<APIKeys />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/sandbox" element={<Sandbox />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/notifications/:id" element={<Notifications />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
};

export default App;
