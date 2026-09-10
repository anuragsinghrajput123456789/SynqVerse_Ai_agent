'use client';

import React from 'react';
import { OperationsOverviewMetrics } from '@/lib/analytics/types';
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, Users, FileCheck } from 'lucide-react';

interface AnalyticsOverviewCardsProps {
  overview: OperationsOverviewMetrics | null;
  loading: boolean;
  lastUpdated: string;
}

export default function AnalyticsOverviewCards({
  overview,
  loading,
  lastUpdated,
}: AnalyticsOverviewCardsProps) {
  const formattedSyncTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Live';

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6D5DF5]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
            1. Operations Overview
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Last Synced: {formattedSyncTime}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1: Active Incidents */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1.5 transition-all hover:border-amber-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Active Incidents</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {loading ? '...' : (overview?.activeIncidents ?? 0)}
          </p>
          <span className="text-[11px] text-amber-700 font-medium block">
            Under active resolution
          </span>
        </div>

        {/* Metric 2: Resolved Incidents */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1.5 transition-all hover:border-emerald-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Resolved Incidents</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {loading ? '...' : (overview?.resolvedIncidents ?? 0)}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium block">
            {overview ? `${overview.resolutionRatePct}% Resolution Rate` : 'SLA Target met'}
          </span>
        </div>

        {/* Metric 3: Avg Resolution Time */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1.5 transition-all hover:border-sky-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Avg Resolution</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {loading ? '...' : `${overview?.averageResolutionTimeMin ?? 0}m`}
          </p>
          <span className="text-[11px] text-slate-500 block">
            Time to resolution
          </span>
        </div>

        {/* Metric 4: Pending Approvals */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1.5 transition-all hover:border-indigo-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Pending Approvals</span>
            <FileCheck className="w-4 h-4 text-[#6D5DF5]" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {loading ? '...' : (overview?.pendingApprovals ?? 0)}
          </p>
          <span className="text-[11px] text-indigo-700 font-medium block">
            Human dispatcher gate
          </span>
        </div>

        {/* Metric 5: Active Emergencies */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1.5 transition-all hover:border-rose-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Active Emergencies</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black font-mono tracking-tight text-slate-900">
            {loading ? '...' : (overview?.activeEmergencies ?? 0)}
          </p>
          <span className="text-[11px] text-rose-700 font-medium block">
            {overview && overview.activeEmergencies > 0 ? 'Priority escalation' : 'Highway corridors clear'}
          </span>
        </div>

        {/* Metric 6: Drivers Online */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1.5 transition-all hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Drivers Online</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            {loading ? '...' : (overview?.driversOnline ?? 0)}
          </p>
          <span className="text-[11px] text-slate-500 block">
            Live telemetry stream
          </span>
        </div>
      </div>
    </section>
  );
}
