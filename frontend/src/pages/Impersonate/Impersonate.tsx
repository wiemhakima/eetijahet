import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { setImpersonationToken } from '../../store/slices/authSlice';
import './Impersonate.scss';

/**
 * Impersonate page - handles impersonation token from URL
 * This page is opened in a new window/tab by admins to view the dashboard as another user
 * It uses sessionStorage (tab-specific) instead of localStorage to not affect the admin's session
 */
const Impersonate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleImpersonation = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setError('No impersonation token provided');
        return;
      }

      try {
        // Use sessionStorage instead of localStorage!
        // sessionStorage is unique per tab/window, so it won't affect the admin's session
        sessionStorage.setItem('impersonate_token', token);
        sessionStorage.setItem('impersonating', 'true');
        
        // Dispatch action to update Redux state with impersonation token
        const result = await dispatch(setImpersonationToken(token));
        
        if (setImpersonationToken.fulfilled.match(result)) {
          setStatus('success');
          // Redirect to dashboard after a short delay to show the status
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        } else {
          setStatus('error');
          setError('Failed to verify impersonation token');
        }
      } catch (err) {
        setStatus('error');
        setError('An error occurred during impersonation');
        console.error('Impersonation error:', err);
      }
    };

    handleImpersonation();
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="impersonate-page">
      <div className="impersonate-container">
        {status === 'loading' && (
          <div className="impersonate-status loading">
            <div className="spinner"></div>
            <h2>Setting up impersonation session...</h2>
            <p>Please wait while we prepare the user view</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="impersonate-status success">
            <svg className="check-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Impersonation Active</h2>
            <p>Redirecting to dashboard...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="impersonate-status error">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Impersonation Failed</h2>
            <p>{error}</p>
            <button onClick={() => window.close()}>Close Window</button>
          </div>
        )}

        <div className="impersonate-warning">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>This is an impersonation session. Actions taken here will affect the impersonated user's account.</span>
        </div>
      </div>
    </div>
  );
};

export default Impersonate;
