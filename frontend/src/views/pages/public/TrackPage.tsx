import React from 'react';
import { useParams } from 'react-router-dom';
import DriverCard from '../../../pages/TrackPage/components/DriverCard';
import StatusTimeline from '../../../pages/TrackPage/components/StatusTimeline';

const TrackPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  return (
    <div className="track-page">
      <div className="container">
        <h1>Track Delivery #{code}</h1>
        <StatusTimeline />
        <DriverCard />
      </div>
    </div>
  );
};

export default TrackPage;
