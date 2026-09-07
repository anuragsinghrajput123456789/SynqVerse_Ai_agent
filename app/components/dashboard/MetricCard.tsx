'use client';

import React from 'react';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: number | string;
  trend: string;
  isPositive?: boolean;
  description: string;
  accent: 'cyan' | 'purple' | 'blue' | 'amber' | 'emerald' | 'pink';
  icon: LucideIcon;
  bars: number[];
}

const accentConfig = {
  cyan: {
    iconBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.25)]',
    trendColor: 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.25)]',
    barColor: 'bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.4)]',
    borderHover: 'hover:border-cyan-500/50 hover:shadow-[0_10px_30px_rgba(0,240,255,0.15)]',
  },
  purple: {
    iconBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
    trendColor: 'text-purple-300 bg-purple-500/20 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    barColor: 'bg-gradient-to-t from-purple-600 to-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
    borderHover: 'hover:border-purple-500/50 hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)]',
  },
  pink: {
    iconBg: 'bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-[0_0_12px_rgba(236,72,153,0.25)]',
    trendColor: 'text-pink-300 bg-pink-500/20 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]',
    barColor: 'bg-gradient-to-t from-pink-600 to-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.4)]',
    borderHover: 'hover:border-pink-500/50 hover:shadow-[0_10px_30px_rgba(236,72,153,0.15)]',
  },
  blue: {
    iconBg: 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
    trendColor: 'text-sky-300 bg-sky-500/20 border border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.2)]',
    barColor: 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]',
    borderHover: 'hover:border-sky-500/50 hover:shadow-[0_10px_30px_rgba(56,189,248,0.15)]',
  },
  amber: {
    iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    trendColor: 'text-amber-300 bg-amber-500/20 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    barColor: 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    borderHover: 'hover:border-amber-500/50 hover:shadow-[0_10px_30px_rgba(245,158,11,0.15)]',
  },
  emerald: {
    iconBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    trendColor: 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    barColor: 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    borderHover: 'hover:border-emerald-500/50 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)]',
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
  const config = accentConfig[accent] || accentConfig.cyan;
  const displayValue = typeof value === 'number' ? (value < 10 ? `0${value}` : `${value}`) : value;

  return (
    <div
      className={`bg-gradient-to-br from-[#0c1428]/90 via-[#090e1e]/85 to-[#040814]/90 border border-white/[0.09] rounded-2xl p-5 backdrop-blur-xl shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${config.borderHover}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {displayValue}
          </p>
        </div>

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.iconBg} transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-end justify-between mt-4 pt-3 border-t border-white/[0.07]">
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
          <p className="text-[11px] text-slate-400 mt-1 font-mono">{description}</p>
        </div>

        {/* Mini Sparkline Bar Graph */}
        <div className="flex items-end gap-1.5 h-9 px-1" title="Telemetry activity curve">
          {bars.map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full ${config.barColor} opacity-85 hover:opacity-100 transition-all duration-300`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
