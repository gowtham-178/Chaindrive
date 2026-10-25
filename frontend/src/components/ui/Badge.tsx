import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-ink/10 text-ink',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    info: 'bg-info/10 text-info border border-info/20',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center 
        font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export interface StatusChipProps {
  status: 'active' | 'pending' | 'suspended' | 'revoked' | 'expired' | 'paid' | 'disputed' | 'resolved' | 'approved' | 'rejected';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  const statusConfig = {
    active: { variant: 'success' as const, label: 'Active' },
    pending: { variant: 'warning' as const, label: 'Pending' },
    suspended: { variant: 'warning' as const, label: 'Suspended' },
    revoked: { variant: 'danger' as const, label: 'Revoked' },
    expired: { variant: 'default' as const, label: 'Expired' },
    paid: { variant: 'success' as const, label: 'Paid' },
    disputed: { variant: 'info' as const, label: 'Disputed' },
    resolved: { variant: 'success' as const, label: 'Resolved' },
    approved: { variant: 'success' as const, label: 'Approved' },
    rejected: { variant: 'danger' as const, label: 'Rejected' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};
