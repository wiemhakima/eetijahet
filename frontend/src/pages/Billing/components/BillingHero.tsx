import React from 'react';
import { motion } from 'framer-motion';
import { CreditsData } from './billingData';

interface BillingHeroProps {
  data: CreditsData;
}

const BillingHero: React.FC<BillingHeroProps> = ({ data }) => {
  return (
    <motion.div
      className="billing-hero"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="hero-gradient-bg">
        <div className="hero-pattern"></div>
        <div className="hero-gradient-overlay"></div>
      </div>
      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-breadcrumb">
            <span className="breadcrumb-label">Account</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="breadcrumb-current">Billing</span>
          </div>
          <h1 className="hero-title">
            API <span className="hero-title-accent">Credits</span>
          </h1>
          <p className="hero-subtitle">
            Buy credits, track your usage, and manage how each API service consumes your balance.
          </p>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-card">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h0M2 9.5h20" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.remainingCredits.toLocaleString()}</span>
              <span className="stat-label">Credits Remaining</span>
            </div>
          </div>
          <div className="hero-stat-card">
            <div className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.costPerRequest}</span>
              <span className="stat-label">Credits / Request</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BillingHero;
