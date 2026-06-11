import React from 'react';

interface DriverInfo {
  name:  string;
  phone?: string;
  photo?: string;
}

interface Props {
  driver: DriverInfo;
}

const DriverCard: React.FC<Props> = ({ driver }) => (
  <div className="driver-card">
    <div className="driver-card__avatar">
      {driver.photo
        ? <img src={driver.photo} alt={driver.name} />
        : <span className="driver-card__avatar-fallback">🧑‍✈️</span>
      }
    </div>
    <div className="driver-card__info">
      <p className="driver-card__name">{driver.name}</p>
      <p className="driver-card__role">Your driver</p>
    </div>
    {driver.phone && (
      <a href={`tel:${driver.phone}`} className="driver-card__call">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.4 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.79-1.79a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        Call
      </a>
    )}
  </div>
);

export default DriverCard;
