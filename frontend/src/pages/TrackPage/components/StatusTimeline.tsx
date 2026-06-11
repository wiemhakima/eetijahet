import React from 'react';

export type DeliveryStatus = 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

const STEPS: { key: DeliveryStatus; label: string; icon: string }[] = [
  { key: 'pending',    label: 'Order Received',   icon: '📋' },
  { key: 'accepted',   label: 'Driver Assigned',  icon: '🤝' },
  { key: 'picked_up',  label: 'Parcel Picked Up', icon: '📦' },
  { key: 'in_transit', label: 'On the Way',       icon: '🚚' },
  { key: 'delivered',  label: 'Delivered',        icon: '✅' },
];

const ORDER: Record<string, number> = {
  pending: 0, accepted: 1, picked_up: 2, in_transit: 3, delivered: 4, cancelled: -1,
};

interface Props {
  status: string;
}

const StatusTimeline: React.FC<Props> = ({ status }) => {
  const currentIdx = ORDER[status] ?? 0;
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="st st--cancelled">
        <span className="st__cancelled-icon">❌</span>
        <span className="st__cancelled-label">Delivery Cancelled</span>
      </div>
    );
  }

  return (
    <div className="st">
      {STEPS.map((step, i) => {
        const isDone    = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className={`st__step${isDone ? ' st__step--done' : ''}${isCurrent ? ' st__step--current' : ''}`}>
            <div className="st__dot">
              {isDone ? '✓' : step.icon}
            </div>
            <div className="st__label">{step.label}</div>
            {i < STEPS.length - 1 && (
              <div className={`st__line${isDone ? ' st__line--done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
