'use client';

import React from 'react';
import Link from 'next/link';
import { useLiveFleet } from '@/app/hooks/useLiveFleet';
import { MapPin, Navigation, Zap, ArrowRight } from 'lucide-react';

export default function FleetOverview() {
  const { stats } = useLiveFleet({
    useSSE: false, // light polling for dashboard widget
    pollingIntervalMs: 10000,
  });

  return (
    <div className="cyber-card p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>Live Operations Map</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                180/min
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Geospatial fleet telemetry &amp; highway corridors</p>
          </div>
        </div>

        <Link
          href="/map"
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 group font-mono"
        >
          <span>Open Radar</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Fleet Telemetry Pill Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.08] hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>In Transit</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-black text-cyan-300 font-mono drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
              {stats.active}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">active units</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.08] hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Delayed</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {stats.delayed}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">escalated</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.08] hover:border-purple-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Avg Speed</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono">
              {stats.avgSpeedKmh}
            </span>
            <span className="text-[11px] text-purple-300 font-mono">km/h</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.08] hover:border-indigo-500/30 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Tracked</span>
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono">
              {stats.total}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">fleet units</span>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          GPS Stream Nominal (6ms)
        </span>
        <Link
          href="/map"
          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-semibold transition shadow-[0_0_12px_rgba(0,240,255,0.2)]"
        >
          Track All Units
        </Link>
      </div>
    </div>
  );
}
