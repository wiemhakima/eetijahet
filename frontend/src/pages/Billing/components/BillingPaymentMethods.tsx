import React from 'react';
import { motion } from 'framer-motion';
import { CreditCardIcon, ShieldIcon } from './BillingIcons';
import { CreditsData, CreditPackage } from './billingData';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { purchaseCredits, clearPurchaseStatus } from '../../../store/slices/creditsSlice';

interface BillingPaymentMethodsProps {
  data: CreditsData;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 10 },
  },
};

const BillingPaymentMethods: React.FC<BillingPaymentMethodsProps> = ({ data }) => {
  const dispatch = useAppDispatch();
  const { isPurchasing, purchaseError, purchaseSuccess } = useAppSelector((state) => state.credits);

  const handlePurchase = (packageId: string) => {
    dispatch(clearPurchaseStatus());
    dispatch(purchaseCredits(packageId));
  };

  // Auto-clear purchase success message after 3 seconds
  React.useEffect(() => {
    if (purchaseSuccess) {
      const timer = setTimeout(() => {
        dispatch(clearPurchaseStatus());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [purchaseSuccess, dispatch]);

  return (
    <motion.div className="billing-card payment-methods-card" variants={itemVariants}>
      <div className="billing-card-header">
        <div className="card-title-group">
          <div className="card-icon">
            <CreditCardIcon />
          </div>
          <div>
            <h2>Buy Credits</h2>
            <p>Choose a package to top up your balance</p>
          </div>
        </div>
      </div>
      <div className="billing-card-content">
        {/* Purchase status messages */}
        {purchaseSuccess && (
          <div className="purchase-success-message">
            ✓ Credits purchased successfully! Your balance has been updated.
          </div>
        )}
        {purchaseError && (
          <div className="purchase-error-message">
            ✗ {purchaseError}
          </div>
        )}

        {/* Credit Packages */}
        <div className="credit-packages-grid">
          {data.packages.map((pkg: CreditPackage) => (
            <div className={`credit-package ${pkg.popular ? 'popular' : ''}`} key={pkg.id}>
              {pkg.popular && <div className="popular-badge">Most Popular</div>}
              <div className="package-name">{pkg.name}</div>
              <div className="package-credits">{pkg.credits.toLocaleString()}</div>
              <div className="package-credits-label">credits</div>
              <div className="package-price">${pkg.price}</div>
              <div className="package-per-credit">
                ${pkg.pricePerCredit.toFixed(4)} / credit
              </div>
              {pkg.savings && <div className="package-savings">{pkg.savings}</div>}
              <button
                className={`package-buy-btn ${pkg.popular ? 'primary' : ''}`}
                onClick={() => handlePurchase(pkg.id)}
                disabled={isPurchasing}
              >
                {isPurchasing ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Credit Alerts */}
        <div className="billing-alerts-section">
          <div className="alerts-header">
            <ShieldIcon />
            <h3>Credit Alerts</h3>
          </div>
          <div className="alert-options">
            {data.alerts.map((alert) => (
              <div className="alert-option" key={alert.id}>
                <div className="alert-option-info">
                  <div className="alert-option-title">{alert.title}</div>
                  <div className="alert-option-desc">{alert.description}</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked={alert.enabled} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BillingPaymentMethods;
