import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'critical'
  | 'info'
  | 'purple'
  | 'cyan'
  | 'neutral'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35 shadow-[0_0_10px_rgba(99,102,241,0.15)]',
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
  critical: 'bg-rose-500/20 text-rose-300 border-rose-500/35 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
  info: 'bg-blue-500/20 text-blue-300 border-blue-500/35 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
  purple: 'bg-violet-500/20 text-violet-300 border-violet-500/35 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/35 shadow-[0_0_10px_rgba(6,182,212,0.15)]',
  neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
  outline: 'bg-transparent text-slate-300 border-slate-700',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-indigo-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  critical: 'bg-rose-400',
  info: 'bg-blue-400',
  purple: 'bg-violet-400',
  cyan: 'bg-cyan-400',
  neutral: 'bg-slate-400',
  outline: 'bg-slate-400',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  pulse = false,
  className = '',
  ...props
}: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border font-sans tracking-tight transition-colors backdrop-blur-md ${variantStyles[variant]} ${sizeClasses} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]} ${
            pulse ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
