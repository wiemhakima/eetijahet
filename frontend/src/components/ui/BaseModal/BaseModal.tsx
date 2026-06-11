import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './BaseModal.scss';

export interface BaseModalProps {
  show: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({
  show,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = '540px',
  children,
  footer,
}) => {
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [show, onClose]);

  if (!show) return null;

  return createPortal(
    <div className="bm-overlay" onClick={onClose}>
      <div
        className="bm-container"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <div className="bm-header">
          <div className="bm-header__left">
            {icon && <div className="bm-header__icon">{icon}</div>}
            <div className="bm-header__text">
              {title && <h3 className="bm-title">{title}</h3>}
              {subtitle && <p className="bm-subtitle">{subtitle}</p>}
            </div>
          </div>
          <button className="bm-close" onClick={onClose} type="button" aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="bm-body">
          {children}
        </div>

        {footer && (
          <div className="bm-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default BaseModal;
