import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logoutUser } from '../../../store/slices/authSlice';
import { useMerchantSocket } from '../../../hooks/useSocket';
import { NotificationBell } from '../../../components/NotificationBell';
import MerchantProfileModal from './MerchantProfileModal';
import api from '../../../api';
import './MerchantLayout.scss';

interface Props { children: React.ReactNode; }

const NAV = [
  { to: '/merchant/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/merchant/orders',    icon: '📦', label: 'My Orders' },
  { to: '/merchant/orders/new',icon: '➕', label: 'New Order' },
];

const MerchantLayout: React.FC<Props> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('merchant-dark') === 'true');
  const [merchantId, setMerchantId] = useState<string | undefined>(undefined);
  const [storeName, setStoreName]   = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    api.get('/v1/merchant/profile').then(res => {
      const m = res.data?.data;
      if (m) {
        setMerchantId(m._id);
        setStoreName(m.storeName || '');
        setAgencyName(m.agency?.name || '');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  }, []);

  useMerchantSocket(merchantId);

  const toggleDark = () => {
    setDarkMode(d => {
      localStorage.setItem('merchant-dark', String(!d));
      return !d;
    });
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const initials = storeName
    ? storeName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : (user?.firstName?.[0]?.toUpperCase() || 'M');

  return (
    <>
      {/* Fixed notification bell — outside any clipping container */}
      <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 1500 }}>
        <NotificationBell navigateTo="/merchant/orders" />
      </div>

      <div className={`merchant-layout${darkMode ? ' merchant-layout--dark' : ''}`}>
        <aside className="merchant-sidebar">
          <div className="merchant-sidebar__logo">
            <div className="logo-icon">🏪</div>
            <div className="logo-text">
              <h2>Merchant</h2>
              <p>{user?.firstName} {user?.lastName}</p>
            </div>
          </div>

          {storeName && (
            <button className="merchant-profile-card" onClick={() => setProfileOpen(true)}>
              <div className="merchant-profile-card__avatar">{initials}</div>
              <div className="merchant-profile-card__info">
                <div className="merchant-profile-card__store">{storeName}</div>
                {agencyName && <div className="merchant-profile-card__agency">{agencyName}</div>}
              </div>
              <span className="merchant-profile-card__edit">✏️</span>
            </button>
          )}

          <span className="merchant-sidebar__section-label">Navigation</span>

          <nav className="merchant-sidebar__nav">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/merchant/dashboard'}
                className={({ isActive }) =>
                  `merchant-sidebar__link${isActive ? ' merchant-sidebar__link--active' : ''}`
                }
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="merchant-sidebar__footer">
            <button className="merchant-sidebar__dark-toggle" onClick={toggleDark}>
              <span>{darkMode ? '☀️' : '🌙'}</span>
              {darkMode ? 'Light mode' : 'Dark mode'}
              <span className={`toggle-pill${darkMode ? ' toggle-pill--on' : ''}`} />
            </button>
            <button className="merchant-sidebar__logout" onClick={handleLogout}>
              <span>🚪</span> Sign out
            </button>
          </div>
        </aside>

        <main className="merchant-main">{children}</main>
      </div>

      {profileOpen && (
        <MerchantProfileModal
          onClose={() => setProfileOpen(false)}
          onSaved={newStoreName => {
            if (newStoreName) setStoreName(newStoreName);
            setProfileOpen(false);
          }}
        />
      )}
    </>
  );
};

export default MerchantLayout;
