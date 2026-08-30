import React from 'react';
import { cn } from '../../lib/utils';

export const LoadingSkeleton: React.FC<{ className?: string; count?: number }> = ({
  className,
  count = 1,
}) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('h-12 bg-slate-100 rounded-2xl animate-pulse', className)}
        />
      ))}
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 bg-slate-100 rounded-2xl lg:col-span-2" />
        <div className="h-80 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  );
};
