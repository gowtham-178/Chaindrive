import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '4rem'),
  };

  return (
    <div
      className={`
        animate-pulse bg-ink/10
        ${variantStyles[variant]}
        ${className}
      `}
      style={style}
      aria-hidden="true"
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white border border-ink/10 rounded-xl p-6 shadow-sm">
      <Skeleton variant="text" width="60%" height="1.5rem" className="mb-4" />
      <Skeleton variant="text" width="100%" height="1rem" className="mb-2" />
      <Skeleton variant="text" width="80%" height="1rem" className="mb-4" />
      <Skeleton variant="rectangular" width="100%" height="8rem" />
    </div>
  );
};
