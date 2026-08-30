import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 
  | 'active' 
  | 'pending' 
  | 'completed' 
  | 'verified' 
  | 'rejected' 
  | 'revoked' 
  | 'in_progress' 
  | 'upcoming' 
  | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  className,
  dot = true,
}) => {
  // Infer variant from status string if not specified
  const getVariant = (st: string): BadgeVariant => {
    if (variant) return variant;
    const s = st.toUpperCase();
    if (['ACTIVE', 'APPROVED', 'ISSUED', 'VERIFIED', 'COMPLETED', 'PRESENT', 'EMPLOYED'].includes(s)) return 'active';
    if (['PENDING', 'UNDER_REVIEW', 'SUBMITTED', 'IN_PROGRESS', 'UPCOMING', 'APPRENTICESHIP'].includes(s)) return 'pending';
    if (['REJECTED', 'REVOKED', 'SUSPENDED', 'FAILED', 'ABSENT', 'UNEMPLOYED', 'DROPPED'].includes(s)) return 'rejected';
    return 'neutral';
  };

  const activeVariant = getVariant(status);

  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
    active: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200/80',
      dot: 'bg-amber-500',
    },
    completed: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200/80',
      dot: 'bg-blue-500',
    },
    verified: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200/80',
      dot: 'bg-indigo-500',
    },
    rejected: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200/80',
      dot: 'bg-rose-500',
    },
    revoked: {
      bg: 'bg-rose-100',
      text: 'text-rose-800',
      border: 'border-rose-300',
      dot: 'bg-rose-600',
    },
    in_progress: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200/80',
      dot: 'bg-sky-500',
    },
    upcoming: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200/80',
      dot: 'bg-purple-500',
    },
    neutral: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const style = variantStyles[activeVariant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse', style.dot)} />}
      <span className="capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
    </span>
  );
};
