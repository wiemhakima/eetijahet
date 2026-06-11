import React from 'react';
import { motion } from 'framer-motion';
import { APIIcon } from './BillingIcons';
import { CreditsData } from './billingData';

interface BillingCostBreakdownProps {
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

const BillingCostBreakdown: React.FC<BillingCostBreakdownProps> = ({ data }) => {
  const totalCreditsUsed = data.services.reduce((sum, s) => sum + s.totalCreditsUsed, 0);
  const maxCreditsUsed = Math.max(...data.services.map((s) => s.totalCreditsUsed));

  return (
    <motion.div className="billing-card cost-breakdown-card" variants={itemVariants}>
      <div className="billing-card-header">
        <div className="card-title-group">
          <div className="card-icon">
            <APIIcon />
          </div>
          <div>
            <h2>Credit Usage by Service</h2>
            <p>How each API endpoint consumes your credits</p>
          </div>
        </div>
        <div className="card-total">
          <span className="total-label">Total Used</span>
          <span className="total-value">{totalCreditsUsed.toLocaleString()}</span>
        </div>
      </div>
      <div className="billing-card-content">
        {/* Service Table */}
        <div className="service-deductions-table">
          <div className="service-table-header">
            <span>Service</span>
            <span>Credits/Req</span>
            <span>Requests</span>
            <span>Credits Used</span>
          </div>
          {data.services.map((service, index) => {
            const percentage = totalCreditsUsed > 0 ? ((service.totalCreditsUsed / totalCreditsUsed) * 100).toFixed(1) : '0';
            const barWidth = maxCreditsUsed > 0 ? (service.totalCreditsUsed / maxCreditsUsed) * 100 : 0;

            return (
              <div className="service-row" key={index}>
                <div className="service-row-main">
                  <div className="service-name-cell">
                    <div className="cost-color-dot" style={{ backgroundColor: service.color }}></div>
                    <div className="service-name-info">
                      <span className="service-name">{service.name}</span>
                      <span className="service-endpoint">{service.endpoint}</span>
                    </div>
                  </div>
                  <div className="service-credits-per">
                    <span className="credits-badge">{service.creditsPerRequest} cr</span>
                  </div>
                  <div className="service-requests">
                    {service.totalRequests.toLocaleString()}
                  </div>
                  <div className="service-total-credits">
                    <span className="credits-used-value">{service.totalCreditsUsed.toLocaleString()}</span>
                    <span className="credits-used-percent">{percentage}%</span>
                  </div>
                </div>
                <div className="service-bar">
                  <div
                    className="service-bar-fill"
                    style={{ width: `${barWidth}%`, backgroundColor: service.color }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Daily Usage Chart */}
        <div className="daily-cost-chart">
          <h3>Daily Credit Consumption</h3>
          <div className="chart-container">
            {data.usageHistory.map((day, index) => {
              const maxDaily = Math.max(...data.usageHistory.map((d) => d.credits));
              const heightPercent = maxDaily > 0 ? (day.credits / maxDaily) * 100 : 0;

              return (
                <div className="chart-column" key={index}>
                  <div className="chart-bar-wrapper">
                    <div className="chart-bar" style={{ height: `${heightPercent}%` }}>
                      <div className="chart-tooltip">{day.credits} credits</div>
                    </div>
                  </div>
                  <div className="chart-label">{day.date}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BillingCostBreakdown;
