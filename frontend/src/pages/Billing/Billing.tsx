import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import BillingHero from './components/BillingHero';
import BillingBalanceCards from './components/BillingBalanceCards';
import BillingCostBreakdown from './components/BillingCostBreakdown';
import BillingInvoices from './components/BillingInvoices';
import BillingPaymentMethods from './components/BillingPaymentMethods';
import { mockCreditsData } from './components/billingData';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCreditsOverview } from '../../store/slices/creditsSlice';
import './Billing.scss';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const Billing: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: creditsData, isLoading, error } = useAppSelector((state) => state.credits);

  useEffect(() => {
    dispatch(fetchCreditsOverview());
  }, [dispatch]);

  // Use real data from API if available, fall back to mock data
  const data = creditsData || mockCreditsData;

  return (
    <div className="billing-page">
      {error && !creditsData && (
        <div className="billing-error">
          <p>Failed to load credits data. Showing cached data.</p>
          <button onClick={() => dispatch(fetchCreditsOverview())} className="billing-retry-btn">
            Retry
          </button>
        </div>
      )}

      <motion.div
        className="billing-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <BillingHero data={data} />

        {/* Balance Cards Grid */}
        <BillingBalanceCards data={data} isLoading={isLoading && !creditsData} />

        {/* Buy Credits - full width */}
        <BillingPaymentMethods data={data} />

        {/* Main Content Grid: Service Usage + Transactions */}
        <div className="billing-main-grid">
          {/* Credit Usage by Service */}
          <BillingCostBreakdown data={data} />

          {/* Transaction History */}
          <BillingInvoices data={data} />
        </div>
      </motion.div>
    </div>
  );
};

export default Billing;
