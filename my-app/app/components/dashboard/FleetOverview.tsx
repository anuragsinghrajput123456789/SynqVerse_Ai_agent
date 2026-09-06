'use client';

import React from 'react';
import Link from 'next/link';
import { useLiveFleet } from '@/app/hooks/useLiveFleet';

export default function FleetOverview() {
  const { stats } = useLiveFleet({
    useSSE: false, // light polling for dashboard widget
    pollingIntervalMs: 10000,
  });

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Live Operations Map</h3>
            <p className="text-[11px] text-slate-400">Geospatial fleet telemetry & corridors</p>
          </div>
        </div>

        <Link
          href="/map"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
        >
          Open Radar &rarr;
        </Link>
      </div>

      {/* Fleet Telemetry Pill Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>In Transit</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black text-emerald-400">{stats.active}</span>
            <span className="text-[11px] text-slate-500">units</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Delayed</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black text-amber-400">{stats.delayed}</span>
            <span className="text-[11px] text-slate-500">units</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Avg Speed</span>
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black text-white">{stats.avgSpeedKmh}</span>
            <span className="text-[11px] text-slate-400">km/h</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Tracked</span>
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-black text-white">{stats.total}</span>
            <span className="text-[11px] text-slate-500">fleets</span>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          GPS Stream Nominal
        </span>
        <Link
          href="/map"
          className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition"
        >
          Track All Units
        </Link>
      </div>
    </div>
  );
}
