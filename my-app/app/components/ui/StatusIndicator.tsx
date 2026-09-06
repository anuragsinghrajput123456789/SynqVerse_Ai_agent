import React from 'react';

export interface StatusIndicatorProps {
  status: 'online' | 'busy' | 'offline' | 'warning';
  label?: string;
  pulse?: boolean;
}

export default function StatusIndicator({
  status = 'online',
  label,
  pulse = true,
}: StatusIndicatorProps) {
  const colors = {
    online: 'bg-emerald-400 shadow-emerald-400/50',
    busy: 'bg-indigo-400 shadow-indigo-400/50',
    offline: 'bg-slate-500 shadow-slate-500/50',
    warning: 'bg-amber-400 shadow-amber-400/50',
  };

  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status === 'online'
                ? 'bg-emerald-400'
                : status === 'busy'
                ? 'bg-indigo-400'
                : 'bg-amber-400'
            }`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 shadow-xs ${colors[status]}`}
        />
      </span>
      {label && <span>{label}</span>}
    </div>
  );
}
