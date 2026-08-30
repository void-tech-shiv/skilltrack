import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  subLabel?: string;
  variant?: 'brand' | 'emerald' | 'amber' | 'indigo' | 'rose';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  subLabel,
  variant = 'brand',
  size = 'md',
  showPercentage = true,
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const variantStyles = {
    brand: 'bg-brand-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-600',
    rose: 'bg-rose-500',
  };

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700">{label}</span>
          <div className="flex items-center space-x-1.5">
            {subLabel && <span className="text-slate-400 text-[11px] font-normal">{subLabel}</span>}
            {showPercentage && <span className="text-slate-900 font-bold">{Math.round(clamped)}%</span>}
          </div>
        </div>
      )}
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variantStyles[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
