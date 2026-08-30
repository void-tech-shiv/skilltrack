import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label?: string;
  };
  subtitle?: string;
  accentColor?: 'brand' | 'emerald' | 'amber' | 'indigo' | 'purple' | 'rose';
  className?: string;
}

const colorMap = {
  brand: {
    iconBg: 'bg-brand-50 text-brand-600',
    border: 'hover:border-brand-200',
    highlight: 'from-brand-500/5 to-transparent',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'hover:border-emerald-200',
    highlight: 'from-emerald-500/5 to-transparent',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    border: 'hover:border-amber-200',
    highlight: 'from-amber-500/5 to-transparent',
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    border: 'hover:border-indigo-200',
    highlight: 'from-indigo-500/5 to-transparent',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600',
    border: 'hover:border-purple-200',
    highlight: 'from-purple-500/5 to-transparent',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600',
    border: 'hover:border-rose-200',
    highlight: 'from-rose-500/5 to-transparent',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  accentColor = 'brand',
  className,
}) => {
  const styles = colorMap[accentColor];

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle transition-all duration-200 hover:shadow-card',
        styles.border,
        className
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none', styles.highlight)} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        </div>
        <div className={cn('p-3 rounded-xl flex-shrink-0 transition-transform duration-200 hover:scale-105', styles.iconBg)}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="relative mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          {trend && (
            <div className="flex items-center space-x-1">
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold',
                  trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                )}
              >
                {trend.isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-400 font-medium">{trend.label}</span>}
            </div>
          )}
          {subtitle && <span className="text-slate-400 font-medium ml-auto">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
