'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  AlertOctagon,
  FileCheck2,
  Layers,
  Sparkles,
  Mic,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';

export default function CapabilityShowcase() {
  return (
    <div className="mt-14 space-y-8">
      {/* Title Header matching the screenshot */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Every capability. A dedicated space.
        </h2>
        <p className="text-sm text-slate-400 font-normal">
          Clean. Focused. Powerful.
        </p>
        <div className="w-16 h-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 mx-auto mt-3" />
      </div>

      {/* Grid of 6 Dedicated Space Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Dashboard Preview */}
        <Link
          href="/dashboard"
          className="group block rounded-3xl glass-panel border border-slate-800 p-5 hover:border-indigo-500/50 transition-all duration-300"
        >
          {/* Mini UI Mockup */}
          <div className="rounded-2xl bg-[#070b16] border border-slate-800/80 p-3.5 space-y-3 h-44 overflow-hidden relative group-hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-semibold text-white">Dashboard</span>
              <span className="text-cyan-400 font-mono">Live Ingest</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Mini Trend Line */}
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Incident Trend</span>
                <div className="h-10 flex items-end gap-1 mt-1">
                  {[20, 45, 30, 60, 40, 75, 65, 85].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-xs"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Mini Donut / Severity */}
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400">Severity</span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-4 border-rose-500 border-t-amber-400 border-r-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <div className="text-[9px] text-slate-400 space-y-0.5">
                    <p className="text-rose-400 font-bold">● Critical</p>
                    <p className="text-amber-400">● Medium</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent activity strip */}
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="truncate">Work order WO-1042 created · 10:21 AM</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                  Dashboard
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time overview of your operations.
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        {/* 2. Incidents Preview */}
        <Link
          href="/tickets"
          className="group block rounded-3xl glass-panel border border-slate-800 p-5 hover:border-rose-500/50 transition-all duration-300"
        >
          {/* Mini UI Mockup */}
          <div className="rounded-2xl bg-[#070b16] border border-slate-800/80 p-3.5 space-y-2 h-44 overflow-hidden group-hover:border-rose-500/30 transition-colors">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-semibold">
                All
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800">
                Critical
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800">
                Medium
              </span>
            </div>

            <div className="space-y-1.5 mt-2">
              {[
                { id: 'BRK-1042', trk: 'TRK-104', client: 'Shakti Cement', sev: 'Critical', color: 'text-rose-400 bg-rose-950/60' },
                { id: 'BRK-1041', trk: 'TRK-221', client: 'Reliance', sev: 'Medium', color: 'text-amber-400 bg-amber-950/60' },
                { id: 'BRK-1040', trk: 'TRK-308', client: 'Adani', sev: 'Low', color: 'text-emerald-400 bg-emerald-950/60' },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[10px] p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 font-mono"
                >
                  <span className="text-white font-bold">{row.id}</span>
                  <span className="text-slate-400">{row.trk}</span>
                  <span className="text-slate-500 truncate max-w-[70px]">{row.client}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] ${row.color}`}>{row.sev}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                  Incidents
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                View, filter and investigate all breakdowns.
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        {/* 3. Incident Details Preview */}
        <Link
          href="/tickets/BRK-1042"
          className="group block rounded-3xl glass-panel border border-slate-800 p-5 hover:border-cyan-500/50 transition-all duration-300"
        >
          {/* Mini UI Mockup */}
          <div className="rounded-2xl bg-[#070b16] border border-slate-800/80 p-3.5 space-y-2.5 h-44 overflow-hidden group-hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">BRK-1042</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
                Critical
              </span>
            </div>

            {/* Stepper Timeline Mini */}
            <div className="flex items-center justify-between py-1 px-1">
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <div key={s} className="flex items-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-[8px] flex items-center justify-center text-white">
                    {s}
                  </span>
                  {s < 7 && <span className="w-3 h-0.5 bg-indigo-500/40" />}
                </div>
              ))}
            </div>

            {/* Decision summary mini */}
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Route checked · Availability checked</span>
              </div>
              <div className="text-slate-400 truncate">
                Maintenance rule: Brake disc replacement due
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Incident Details
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Complete context, decision and audit timeline.
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        {/* 4. Context Explorer Preview */}
        <Link
          href="/context"
          className="group block rounded-3xl glass-panel border border-slate-800 p-5 hover:border-blue-500/50 transition-all duration-300"
        >
          {/* Mini UI Mockup */}
          <div className="rounded-2xl bg-[#070b16] border border-slate-800/80 p-3.5 space-y-2 h-44 overflow-hidden group-hover:border-blue-500/30 transition-colors">
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              <span className="text-white font-bold bg-indigo-900/50 px-2 py-0.5 rounded">Vehicles</span>
              <span>Drivers</span>
              <span>Clients</span>
              <span>Maintenance</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white font-mono">TRK-104</p>
                <p className="text-[10px] text-slate-400">UP-60-BK-0144</p>
                <p className="text-[9px] text-emerald-400 mt-1">● Active · 28 Trips</p>
              </div>
              <div className="w-12 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-xs font-mono text-cyan-300">
                3D TRK
              </div>
            </div>

            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Open Tickets: 2</span>
              <span>Maint: 12 Aug 2025</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  Context Explorer
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Explore entities, sources and conflicts.
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        {/* 5. Operations Copilot Preview */}
        <Link
          href="/chat"
          className="group block rounded-3xl glass-panel border border-slate-800 p-5 hover:border-purple-500/50 transition-all duration-300"
        >
          {/* Mini UI Mockup */}
          <div className="rounded-2xl bg-[#070b16] border border-slate-800/80 p-3.5 space-y-2 h-44 overflow-hidden group-hover:border-purple-500/30 transition-colors">
            <div className="p-2 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-[10px] text-indigo-200 ml-auto max-w-[80%] text-right">
              Why was TRK-104 rejected?
            </div>

            <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 space-y-1">
              <p>TRK-104 was rejected due to unresolved maintenance &amp; eligibility rule.</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-[8px] text-indigo-300 border border-indigo-800">
                  [Maintenance Log]
                </span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-[8px] text-indigo-300 border border-indigo-800">
                  [Dispatcher Rules]
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                  Operations Copilot
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Ask questions with grounded answers.
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        {/* 6. Voice Agent Preview */}
        <Link
          href="/voice"
          className="group block rounded-3xl glass-panel border border-slate-800 p-5 hover:border-cyan-500/50 transition-all duration-300"
        >
          {/* Mini UI Mockup */}
          <div className="rounded-2xl bg-[#070b16] border border-slate-800/80 p-3.5 flex flex-col items-center justify-center space-y-2 h-44 overflow-hidden group-hover:border-cyan-500/30 transition-colors">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-orb">
              <Mic className="w-7 h-7 text-white" />
            </div>
            <p className="text-[11px] font-bold text-white">Listening...</p>
            <p className="text-[10px] text-cyan-400 font-mono italic">
              &ldquo;TRK-104 ko reject kyun kiya gaya?&rdquo;
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Mic className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Voice Agent
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Talk in any language. Get answers.
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
}
