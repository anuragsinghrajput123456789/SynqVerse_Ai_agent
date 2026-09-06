'use client';

import React from 'react';
import Link from 'next/link';
import {
  Mic,
  Play,
  Sparkles,
  CheckSquare,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface QuickActionsProps {
  onRunPipeline?: () => void;
  runningPipeline?: boolean;
}

export default function QuickActions({ onRunPipeline, runningPipeline = false }: QuickActionsProps) {
  return (
    <div className="bg-[#0d1428]/70 border border-white/[0.08] rounded-2xl p-5 shadow-lg backdrop-blur-xl flex flex-col justify-between h-full">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Quick Actions</h2>
          <p className="text-xs text-slate-400">Immediate operational workflows</p>
        </div>
        <Zap className="w-4 h-4 text-cyan-400" />
      </div>

      {/* Actions List */}
      <div className="my-3 space-y-2.5 flex-1">
        {/* Primary Action: Open Voice Agent (Visually Prominent with Glow) */}
        <Link
          href="/voice"
          className="group relative block p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 via-indigo-900/40 to-cyan-950/40 border border-indigo-500/40 hover:border-cyan-400/60 transition-all duration-200 shadow-md shadow-indigo-500/10 hover:shadow-cyan-400/15"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <Mic className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Open Voice Agent</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider animate-pulse">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Talk to Grafity about fleet incidents and operations.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Action 2: Process New Tickets */}
        <button
          type="button"
          onClick={onRunPipeline}
          disabled={runningPipeline}
          className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 transition-colors group cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Process New Tickets</p>
              <p className="text-[11px] text-slate-400">
                {runningPipeline ? 'Executing 13 dispatch rules...' : 'Evaluate active queue and create work orders'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Action 3: Ask Operations Copilot */}
        <Link
          href="/copilot"
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 transition-colors group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Ask Operations Copilot</p>
              <p className="text-[11px] text-slate-400">
                Investigate reasons, SLA rules, and client contracts
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Action 4: View Pending Approvals */}
        <Link
          href="/approvals"
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 transition-colors group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">View Pending Approvals</p>
              <p className="text-[11px] text-slate-400">
                Review and approve exception dispatch candidates
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Action 5: Explore Context */}
        <Link
          href="/context"
          className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 transition-colors group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Explore Context</p>
              <p className="text-[11px] text-slate-400">
                Inspect fleet master records, drivers, and contract terms
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      <div className="pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 text-center">
        Press <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-300 border border-slate-700">V</kbd> anywhere to start Voice Agent
      </div>
    </div>
  );
}
