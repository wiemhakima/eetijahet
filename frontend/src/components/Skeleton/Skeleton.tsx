import React from 'react';
import './Skeleton.scss';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className = '',
  variant = 'text',
  animation = 'wave',
}) => {
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;
  if (borderRadius) style.borderRadius = borderRadius;

  return (
    <div
      className={`skeleton skeleton--${variant} skeleton--${animation} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton for dashboard stat cards
export const StatCardSkeleton: React.FC = () => (
  <div className="stat-card skeleton-stat-card">
    <div className="stat-icon">
      <Skeleton variant="rounded" width="56px" height="56px" borderRadius="0.5rem" />
    </div>
    <div className="stat-content">
      <Skeleton variant="text" width="60%" height="2.25rem" className="skeleton-value" />
      <Skeleton variant="text" width="80%" height="1rem" className="skeleton-label" />
      <Skeleton variant="rounded" width="50%" height="1.5rem" borderRadius="9999px" className="skeleton-badge" />
    </div>
  </div>
);

// Pre-built skeleton for billing balance cards
export const BalanceCardSkeleton: React.FC<{ showBar?: boolean }> = ({ showBar = false }) => (
  <div className="balance-card skeleton-balance-card">
    <div className="balance-card-header">
      <Skeleton variant="rounded" width="44px" height="44px" borderRadius="0.5rem" />
      {showBar && <Skeleton variant="rounded" width="52px" height="22px" borderRadius="9999px" />}
    </div>
    <Skeleton variant="text" width="55%" height="2.25rem" className="skeleton-value" />
    <Skeleton variant="text" width="70%" height="0.875rem" className="skeleton-label" />
    {showBar && (
      <>
        <Skeleton variant="rounded" width="100%" height="8px" borderRadius="9999px" className="skeleton-bar" />
        <div className="skeleton-bar-labels">
          <Skeleton variant="text" width="30%" height="0.75rem" />
          <Skeleton variant="text" width="30%" height="0.75rem" />
        </div>
      </>
    )}
    {!showBar && <Skeleton variant="text" width="60%" height="0.75rem" className="skeleton-comparison" />}
  </div>
);

export default Skeleton;
