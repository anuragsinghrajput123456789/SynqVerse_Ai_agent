'use client';

import React from 'react';
import { IncidentPerformanceMetrics } from '@/lib/analytics/types';
import { CheckCircle2, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

interface IncidentPerformanceSectionProps {
  incidents: IncidentPerformanceMetrics | null;
  loading: boolean;
  onHoverPoint: (point: { metric: string; value: string; time: string } | null) => void;
}

export default function IncidentPerformanceSection({
  incidents,
  loading,
  onHoverPoint,
}: IncidentPerformanceSectionProps) {
  const trendPoints = incidents?.incidentsOverTime || [];
  const severities = incidents?.incidentsBySeverity || [];
  const topCauses = incidents?.topCauses || [];
  const maxCount = Math.max(...trendPoints.map((p) => p.count), 1);

  return (
    <section className="space-y-5 pt-4 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            2. Incident Performance &amp; Trends
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Total Recorded: {incidents?.totalIncidents ?? 0}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Incidents Over Time */}
        <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Incidents Over Time</h3>
              <p className="text-xs text-slate-500">
                Temporal distribution of breakdown and maintenance events across active windows.
              </p>
            </div>
            <span className="text-xs text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              <TrendingUp className="w-3.5 h-3.5 text-[#6D5DF5]" />
              <span>Grounded Trend</span>
            </span>
          </div>

          {loading ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-mono">
              Loading incident trend data...
            </div>
          ) : trendPoints.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl">
              <Activity className="w-6 h-6 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No incident records in this period</p>
              <p className="text-[11px] text-slate-500 mt-0.5">All fleet corridors operate with zero logged tickets.</p>
            </div>
          ) : (
            <div className="h-44 w-full pt-4">
              <div className="flex items-end justify-between h-32 gap-2 border-b border-slate-200 pb-2">
                {trendPoints.map((pt, idx) => {
                  const heightPercent = Math.max(12, Math.round((pt.count / maxCount) * 100));
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() =>
                        onHoverPoint({
                          metric: 'Incidents Logged',
                          value: `${pt.count} breakdown tickets (${pt.resolved} resolved)`,
                          time: pt.date,
                        })
                      }
                      onMouseLeave={() => onHoverPoint(null)}
                      className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div
                        className="w-full max-w-[32px] bg-indigo-100 hover:bg-[#6D5DF5] rounded-t-lg transition-all relative flex items-end justify-center group-hover:shadow-md"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-white absolute -top-6 transition-opacity font-bold bg-slate-900 px-1.5 py-0.5 rounded shadow-sm pointer-events-none">
                          {pt.count}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono truncate w-full text-center">
                        {pt.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {incidents?.insight && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Operational Insight: {incidents.insight}</span>
            </div>
          )}
        </div>

        {/* Chart 2: Incidents by Severity */}
        <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Incidents by Severity</h3>
            <p className="text-xs text-slate-500">Distribution across operational priority tiers.</p>
          </div>

          {loading ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-mono">
              Aggregating severities...
            </div>
          ) : severities.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No severity data available</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {severities.map((s) => {
                const badgeColor =
                  s.severity === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : s.severity === 'HIGH'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : s.severity === 'MEDIUM'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200';

                const barColor =
                  s.severity === 'CRITICAL'
                    ? 'bg-rose-500'
                    : s.severity === 'HIGH'
                    ? 'bg-amber-500'
                    : s.severity === 'MEDIUM'
                    ? 'bg-[#6D5DF5]'
                    : 'bg-slate-400';

                return (
                  <div key={s.severity} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${badgeColor}`}>
                        {s.severity}
                      </span>
                      <span className="font-mono text-slate-600 font-semibold">
                        {s.count} ({s.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${s.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Incident Causes */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-6 space-y-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Top Root Causes</h3>
          <p className="text-xs text-slate-500">
            Categorized mechanical, electrical, and operational factors from ingested failure tickets.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">
            Analyzing breakdown logs...
          </div>
        ) : topCauses.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            No root cause failures logged for this interval.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topCauses.map((c, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block truncate" title={c.cause}>
                  {c.cause}
                </span>
                <p className="text-xl font-extrabold text-slate-900 font-mono">{c.count} Incidents</p>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {c.percentage}% of failure logs
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
