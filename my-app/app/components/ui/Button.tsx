import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30 focus-visible:ring-indigo-500',
  secondary:
    'bg-slate-900/80 hover:bg-slate-850 text-slate-200 hover:text-white border border-white/[0.08] hover:border-slate-700 focus-visible:ring-slate-400 backdrop-blur-md',
  outline:
    'bg-transparent hover:bg-slate-850/60 text-slate-300 hover:text-white border border-slate-700/80 focus-visible:ring-slate-400',
  ghost:
    'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 border border-transparent focus-visible:ring-slate-400',
  danger:
    'bg-rose-600/90 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border border-rose-500/30 focus-visible:ring-rose-500',
  success:
    'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 border border-emerald-500/30 focus-visible:ring-emerald-500',
};

const sizeStyles = {
  xs: 'text-[11px] px-2.5 py-1 rounded-lg gap-1.5',
  sm: 'text-xs px-3.5 py-1.5 rounded-xl gap-2 font-medium',
  md: 'text-xs px-4 py-2 rounded-xl gap-2 font-semibold',
  lg: 'text-sm px-5 py-2.5 rounded-xl gap-2.5 font-semibold',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c18] select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
    </button>
  );
}
