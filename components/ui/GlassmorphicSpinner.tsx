import React from 'react';
import { Spinner } from '@heroui/spinner';
import { cn } from '@/lib/utils';

export interface GlassmorphicSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  label?: string;
  className?: string;
}

export const GlassmorphicSpinner: React.FC<GlassmorphicSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  label,
  className
}) => {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center space-y-3 p-6 rounded-2xl',
        'bg-background/40 backdrop-blur-md border border-default-200/30',
        'shadow-lg shadow-black/5',
        className
      )}
      role="status"
      aria-label={label || 'Loading'}
    >
      <Spinner 
        size={size} 
        color={color}
        aria-hidden="true"
      />
      {label && (
        <p className="text-sm text-default-600 font-medium">
          {label}
        </p>
      )}
    </div>
  );
};

export default GlassmorphicSpinner;