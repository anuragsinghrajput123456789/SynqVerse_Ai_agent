'use client';

import React from 'react';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: number | string;
  trend: string;
  isPositive?: boolean;
  description: string;
  accent: 'purple' | 'blue' | 'amber' | 'emerald';
  icon: LucideIcon;
  bars: number[];
}

const accentConfig = {
  purple: {
    iconBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    trendColor: 'text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.2)]',
    barColor: 'bg-indigo-500',
    borderHover: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
  },
  blue: {
    iconBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    trendColor: 'text-blue-300 bg-blue-500/20 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]',
    barColor: 'bg-blue-500',
    borderHover: 'hover:border-blue-500/40 hover:shadow-blue-500/10',
  },
  amber: {
    iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    trendColor: 'text-amber-300 bg-amber-500/20 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
    barColor: 'bg-amber-500',
    borderHover: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
  },
  emerald: {
    iconBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    trendColor: 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
    barColor: 'bg-emerald-500',
    borderHover: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
  },
};

export default function MetricCard({
  label,
  value,
  trend,
  isPositive = true,
  description,
  accent,
  icon: Icon,
  bars,
}: MetricCardProps) {
  const config = accentConfig[accent];
  const displayValue = typeof value === 'number' ? (value < 10 ? `0${value}` : `${value}`) : value;

  return (
    <div
      className={`bg-[#0d1428]/70 border border-white/[0.08] rounded-2xl p-5 backdrop-blur-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between ${config.borderHover}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight font-mono">
            {displayValue}
          </p>
        </div>

        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${config.iconBg} shadow-inner`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-800/80">
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${config.trendColor}`}
            >
              {trend.startsWith('+') || isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{description}</p>
        </div>

        {/* Mini Sparkline Bar Graph */}
        <div className="flex items-end gap-1 h-9 px-1" title="Historical activity trend">
          {bars.map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${config.barColor} opacity-75 hover:opacity-100 transition-all duration-300 shadow-sm`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
