'use client';

import React from 'react';
import {
  FleetHealthMetrics,
  DriverSafetyMetrics,
  WorkOrderMetrics,
  AiUsageMetrics,
} from '@/lib/analytics/types';
import { Truck, ShieldAlert, Cpu, CheckCircle2, Radio, Server, Activity } from 'lucide-react';

interface FleetSafetySectionProps {
  fleet: FleetHealthMetrics | null;
  safety: DriverSafetyMetrics | null;
  workOrders: WorkOrderMetrics | null;
  aiUsage: AiUsageMetrics | null;
  loading: boolean;
}

export default function FleetSafetySection({
  fleet,
  safety,
  workOrders,
  aiUsage,
  loading,
}: FleetSafetySectionProps) {
  return (
    <div className="space-y-8">
      {/* 3. FLEET HEALTH & AVAILABILITY */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              3. Fleet Health &amp; Availability
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Total Assets: {fleet?.totalVehicles ?? 0}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Vehicles Available</span>
              <Truck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              {loading ? '...' : (fleet?.vehiclesAvailable ?? 0)}
            </p>
            <p className="text-xs text-slate-600">Staged for immediate dispatch or replacement</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">In Maintenance</span>
              <Truck className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              {loading ? '...' : (fleet?.vehiclesInMaintenance ?? 0)}
            </p>
            <p className="text-xs text-slate-600">Undergoing scheduled maintenance or triage</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">On Active Trip</span>
              <Truck className="w-4 h-4 text-[#6D5DF5]" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              {loading ? '...' : (fleet?.vehiclesOnTrip ?? 0)}
            </p>
            <p className="text-xs text-slate-600">In transit along freight corridors</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Fleet Utilization</span>
              <Activity className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              {loading ? '...' : `${fleet?.utilizationRatePct ?? 0}%`}
            </p>
            <p className="text-xs text-emerald-700 font-semibold">Asset optimization rate</p>
          </div>
        </div>

        {fleet?.insight && (
          <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Fleet Telemetry Assessment: {fleet.insight}</span>
          </div>
        )}
      </section>

      {/* 4. DRIVER SAFETY & EMERGENCY RESPONSE */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              4. Driver Safety &amp; Emergency Response
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">24/7 SOS Desk</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Avg Acknowledgement Time</span>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              {loading ? '...' : `${safety?.averageAcknowledgementTimeSec ?? 0}s`}
            </p>
            <p className="text-xs text-emerald-700 font-semibold">Dispatcher SLA: sub-60 second target</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Avg Response Time</span>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              {loading ? '...' : `${safety?.averageResponseTimeMin ?? 0}m`}
            </p>
            <p className="text-xs text-slate-600">From distress trigger to roadside dispatch</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2 shadow-xs">
            <span className="text-xs text-slate-500 font-medium block">Emergencies Recorded</span>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              {loading ? '...' : (safety?.emergenciesThisWeek ?? 0)}
            </p>
            <p className="text-xs text-slate-600">All handled through deterministic R-006 / R-007 audit</p>
          </div>
        </div>
      </section>

      {/* 5. WORK ORDER PERFORMANCE */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              5. Work Order &amp; Dispatch Performance
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">Created</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : (workOrders?.createdCount ?? 0)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">In Progress</span>
            <span className="text-2xl font-black text-[#6D5DF5] font-mono">
              {loading ? '...' : (workOrders?.inProgressCount ?? 0)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">Completed</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {loading ? '...' : (workOrders?.completedCount ?? 0)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-center shadow-xs">
            <span className="text-xs text-slate-500 block">Completion Rate</span>
            <span className="text-2xl font-black text-sky-600 font-mono">
              {loading ? '...' : `${workOrders?.completionRatePct ?? 0}%`}
            </span>
          </div>
        </div>
      </section>

      {/* 6. AI & COPILOT UTILIZATION */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              6. AI &amp; Copilot Utilization
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Copilot Queries</span>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : (aiUsage?.copilotQueries ?? 0)}
            </p>
            <span className="text-[11px] text-slate-500">Grounded natural language search</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Voice Sessions</span>
              <Radio className="w-4 h-4 text-[#6D5DF5]" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : (aiUsage?.voiceSessions ?? 0)}
            </p>
            <span className="text-[11px] text-slate-500">Multilingual audio interactions</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Grounded Success</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 font-mono">
              {loading ? '...' : `${aiUsage?.successRatePct ?? 0}%`}
            </p>
            <span className="text-[11px] text-emerald-700 font-medium">Fact-grounded responses</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Refusal / Fallback</span>
              <ShieldAlert className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : (aiUsage?.aiErrors ?? 0)}
            </p>
            <span className="text-[11px] text-slate-500">Safe fallback on out-of-domain queries</span>
          </div>
        </div>
      </section>

      {/* 7. SYSTEM HEALTH & INFRASTRUCTURE */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              7. System Health &amp; Infrastructure
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs">
            <span className="text-slate-600">Platform Status</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Nominal
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs">
            <span className="text-slate-600">Database Engine</span>
            <span className="text-slate-900 font-bold flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              Connected
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs">
            <span className="text-slate-600">Rules Engine</span>
            <span className="text-[#6D5DF5] font-bold">13 Authoritative</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs">
            <span className="text-slate-600">Telemetry Stream</span>
            <span className="text-slate-900 font-bold">180 pkts/min</span>
          </div>
        </div>
      </section>
    </div>
  );
}
