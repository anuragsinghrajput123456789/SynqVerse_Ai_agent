import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'none' | 'indigo' | 'cyan' | 'rose';
  hoverEffect?: boolean;
}

export default function Card({
  children,
  glow = 'none',
  hoverEffect = false,
  className = '',
  ...props
}: CardProps) {
  const glowClasses = {
    none: 'border-white/[0.08] bg-[#0d1428]/75 shadow-lg shadow-black/40',
    indigo: 'border-indigo-500/30 bg-[#0d152d]/85 shadow-lg shadow-indigo-500/15',
    cyan: 'border-cyan-500/30 bg-[#0b192c]/85 shadow-lg shadow-cyan-500/15',
    rose: 'border-rose-500/30 bg-[#1e0f1d]/85 shadow-lg shadow-rose-500/15',
  };

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl transition-all duration-200 ${
        glowClasses[glow]
      } ${
        hoverEffect
          ? 'hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
