import React from 'react';
import { getRoleBadge } from '../../lib/rbac';
import Icon from '../AppIcon';

const RoleBadge = ({ 
  role, 
  showIcon = true, 
  showLabel = true, 
  size = 'sm',
  variant = 'filled'
}) => {
  const badge = getRoleBadge(role);
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const variantClasses = variant === 'outlined' 
    ? `border-2 bg-white ${badge.textColor} border-current`
    : `${badge.color} text-white`;
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${variantClasses}`}>
      {showIcon && (
        <Icon name={badge.icon} size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} />
      )}
      {showLabel && badge.label}
    </span>
  );
};

export default RoleBadge;