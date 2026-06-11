import React from 'react';
import { motion } from 'framer-motion';
import { ReceiptIcon, ExternalLinkIcon } from './BillingIcons';
import { CreditsData, CreditTransaction } from './billingData';

interface BillingInvoicesProps {
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

const getTypeIcon = (type: CreditTransaction['type']) => {
  switch (type) {
    case 'purchase':
      return <span className="txn-type-badge purchase">+ Purchase</span>;
    case 'deduction':
      return <span className="txn-type-badge deduction">− Usage</span>;
    case 'bonus':
      return <span className="txn-type-badge bonus">★ Bonus</span>;
    case 'refund':
      return <span className="txn-type-badge refund">↺ Refund</span>;
    default:
      return null;
  }
};

const BillingInvoices: React.FC<BillingInvoicesProps> = ({ data }) => {
  return (
    <motion.div className="billing-card invoices-card" variants={itemVariants}>
      <div className="billing-card-header">
        <div className="card-title-group">
          <div className="card-icon">
            <ReceiptIcon />
          </div>
          <div>
            <h2>Credit Transactions</h2>
            <p>Purchase history and credit deductions</p>
          </div>
        </div>
        <button className="card-action-btn">
          View All <ExternalLinkIcon />
        </button>
      </div>
      <div className="billing-card-content">
        <div className="invoices-table-wrapper">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Date</th>
                <th>Credits</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((txn: CreditTransaction) => (
                <tr key={txn.id}>
                  <td>{getTypeIcon(txn.type)}</td>
                  <td>
                    <span className="txn-description">{txn.description}</span>
                  </td>
                  <td>
                    <span className="invoice-date">{txn.date}</span>
                  </td>
                  <td>
                    <span className={`txn-credits ${txn.credits > 0 ? 'positive' : 'negative'}`}>
                      {txn.credits > 0 ? '+' : ''}{txn.credits.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="txn-balance">{txn.balance.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default BillingInvoices;
