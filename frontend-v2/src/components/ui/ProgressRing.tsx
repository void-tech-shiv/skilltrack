import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  variant?: 'brand' | 'emerald' | 'amber' | 'indigo' | 'rose';
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 110,
  strokeWidth = 8,
  label,
  subLabel,
  variant = 'brand',
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColors = {
    brand: 'text-brand-600',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    indigo: 'text-indigo-600',
    rose: 'text-rose-500',
  };

  return (
    <div className={cn('relative inline-flex flex-col items-center justify-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={cn('transition-all duration-1000 ease-out', strokeColors[variant])}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-xl font-extrabold text-slate-900 leading-none">{Math.round(clamped)}%</span>
          {label && <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">{label}</span>}
        </div>
      </div>
      {subLabel && <span className="text-xs text-slate-500 font-medium mt-2">{subLabel}</span>}
    </div>
  );
};
