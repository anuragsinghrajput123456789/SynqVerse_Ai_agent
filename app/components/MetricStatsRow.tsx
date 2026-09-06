'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

interface MetricStatsRowProps {
  stats?: {
    activeIncidents?: number;
    processedToday?: number;
    pendingApprovals?: number;
    workOrders?: number;
  };
}

export default function MetricStatsRow({ stats }: MetricStatsRowProps) {
  const metrics = [
    {
      label: 'Active Incidents',
      value: stats?.activeIncidents ?? 12,
      trend: '-20%',
      isPositive: true,
      trendColor: 'text-cyan-400',
      bars: [30, 45, 60, 50, 40, 25],
      barColor: 'bg-cyan-500/80',
    },
    {
      label: 'Processed Today',
      value: stats?.processedToday ?? 48,
      trend: '+12%',
      isPositive: true,
      trendColor: 'text-emerald-400',
      bars: [20, 35, 45, 60, 75, 85],
      barColor: 'bg-emerald-500/80',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals ?? 5,
      trend: '-40%',
      isPositive: true,
      trendColor: 'text-cyan-400',
      bars: [70, 60, 45, 35, 25, 18],
      barColor: 'bg-rose-500/80',
    },
    {
      label: 'Work Orders',
      value: stats?.workOrders ?? 42,
      trend: '+18%',
      isPositive: true,
      trendColor: 'text-emerald-400',
      bars: [35, 40, 55, 65, 70, 80],
      barColor: 'bg-emerald-500/80',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, idx) => {
        const displayValue = m.value < 10 ? `0${m.value}` : `${m.value}`;
        return (
          <div
            key={idx}
            className="rounded-3xl glass-panel border border-slate-800/80 p-5 flex items-center justify-between hover:border-slate-700 transition-all shadow-sm"
          >
            <div>
              <p className="text-xs font-medium text-slate-400">{m.label}</p>
              <p className="text-3xl font-extrabold text-white mt-1.5 tracking-tight font-mono">
                {displayValue}
              </p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${m.trendColor}`}>
                {m.trend.startsWith('+') ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{m.trend}</span>
              </div>
            </div>

            {/* Mini Sparkline Bar Graph */}
            <div className="flex items-end gap-1 h-12 pt-2 px-1">
              {m.bars.map((height, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full ${m.barColor} transition-all duration-500`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
