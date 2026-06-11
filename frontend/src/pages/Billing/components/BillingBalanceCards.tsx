import React from 'react';
import { motion } from 'framer-motion';
import { WalletIcon, TrendingUpIcon, CreditCardIcon, APIIcon } from './BillingIcons';
import { BalanceCardSkeleton } from '../../../components/Skeleton';
import { CreditsData } from './billingData';

interface BillingBalanceCardsProps {
  data: CreditsData;
  isLoading?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 10 },
  },
};

const BillingBalanceCards: React.FC<BillingBalanceCardsProps> = ({ data, isLoading = false }) => {
  const totalRequests = data.services.reduce((sum, s) => sum + s.totalRequests, 0);
  const avgDailyUsage = Math.round(data.usageHistory.reduce((sum, d) => sum + d.credits, 0) / data.usageHistory.length);
  const estimatedDaysLeft = avgDailyUsage > 0 ? Math.floor(data.remainingCredits / avgDailyUsage) : 999;

  if (isLoading) {
    return (
      <motion.div className="billing-balance-grid" variants={itemVariants}>
        <BalanceCardSkeleton showBar />
        <BalanceCardSkeleton />
        <BalanceCardSkeleton />
        <BalanceCardSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div className="billing-balance-grid" variants={itemVariants}>
      {/* Credit Balance */}
      <div className="balance-card current-balance">
        <div className="balance-card-header">
          <div className="balance-icon primary">
            <WalletIcon />
          </div>
          <span className={`balance-badge ${data.remainingCredits < 1000 ? 'red' : 'green'}`}>
            {data.remainingCredits < 1000 ? 'Low' : 'Active'}
          </span>
        </div>
        <div className="balance-amount">{data.remainingCredits.toLocaleString()}</div>
        <div className="balance-label">Credits Remaining</div>
        <div className="budget-bar">
          <div className="budget-bar-fill" style={{ width: `${100 - data.percentUsed}%` }}></div>
        </div>
        <div className="budget-amounts">
          <span>{data.usedCredits.toLocaleString()} used</span>
          <span>{data.totalCredits.toLocaleString()} total</span>
        </div>
      </div>

      {/* Credits Used */}
      <div className="balance-card estimated-total">
        <div className="balance-card-header">
          <div className="balance-icon accent">
            <TrendingUpIcon />
          </div>
        </div>
        <div className="balance-amount">{data.usedCredits.toLocaleString()}</div>
        <div className="balance-label">Credits Used</div>
        <div className="balance-comparison">
          {data.percentUsed.toFixed(1)}% of total credits consumed
        </div>
      </div>

      {/* Total Requests */}
      <div className="balance-card budget-usage">
        <div className="balance-card-header">
          <div className="balance-icon success">
            <APIIcon />
          </div>
        </div>
        <div className="balance-amount">{totalRequests.toLocaleString()}</div>
        <div className="balance-label">Total API Requests</div>
        <div className="balance-comparison">
          Across {data.services.length} endpoints
        </div>
      </div>

      {/* Days Remaining */}
      <div className="balance-card billing-period-card">
        <div className="balance-card-header">
          <div className="balance-icon warning">
            <CreditCardIcon />
          </div>
        </div>
        <div className="balance-amount">~{estimatedDaysLeft}</div>
        <div className="balance-label">Est. Days Left</div>
        <div className="balance-comparison">
          ~{avgDailyUsage.toLocaleString()} credits/day avg
        </div>
      </div>
    </motion.div>
  );
};

export default BillingBalanceCards;
