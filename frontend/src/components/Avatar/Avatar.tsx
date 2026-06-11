import React, { useMemo } from 'react';
import './Avatar.scss';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// Generate a consistent color based on the user's name
const getColorFromName = (name: string): { background: string; text: string } => {
  const colors = [
    { background: '#3b82f6', text: '#ffffff' }, // Blue
    { background: '#8b5cf6', text: '#ffffff' }, // Purple
    { background: '#ec4899', text: '#ffffff' }, // Pink
    { background: '#ef4444', text: '#ffffff' }, // Red
    { background: '#f97316', text: '#ffffff' }, // Orange
    { background: '#eab308', text: '#1f2937' }, // Yellow
    { background: '#22c55e', text: '#ffffff' }, // Green
    { background: '#14b8a6', text: '#ffffff' }, // Teal
    { background: '#06b6d4', text: '#ffffff' }, // Cyan
    { background: '#6366f1', text: '#ffffff' }, // Indigo
    { background: '#a855f7', text: '#ffffff' }, // Violet
    { background: '#f43f5e', text: '#ffffff' }, // Rose
  ];
  
  // Create a simple hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use absolute value and modulo to get a consistent index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Get initials from name
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.trim().charAt(0).toUpperCase() || '';
  const last = lastName?.trim().charAt(0).toUpperCase() || '';
  
  if (first && last) {
    return `${first}${last}`;
  }
  if (first) {
    return first;
  }
  return '?';
};

const Avatar: React.FC<AvatarProps> = ({ 
  firstName = '', 
  lastName = '', 
  size = 'medium',
  className = ''
}) => {
  const initials = useMemo(() => getInitials(firstName, lastName), [firstName, lastName]);
  const colors = useMemo(() => getColorFromName(`${firstName}${lastName}`), [firstName, lastName]);
  
  return (
    <div 
      className={`avatar avatar--${size} ${className}`}
      style={{ 
        backgroundColor: colors.background,
        color: colors.text
      }}
    >
      <span className="avatar__initials">{initials}</span>
    </div>
  );
};

export default Avatar;
