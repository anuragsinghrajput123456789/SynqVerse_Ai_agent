'use client';

import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

interface DashboardHeaderProps {
  onRefresh: () => void;
  onRunPipeline: () => void;
  loading: boolean;
  runningPipeline: boolean;
  pipelineMessage: string | null;
}

export default function DashboardHeader({
  onRefresh,
  onRunPipeline,
  loading,
  runningPipeline,
  pipelineMessage,
}: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {greeting}, Anurag 👋
            </h1>
          </div>
          <p className="text-sm text-slate-400 font-normal mt-0.5">
            Your operations. Smarter. Faster. Safer.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={loading || runningPipeline}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onRunPipeline}
            disabled={runningPipeline}
            loading={runningPipeline}
            icon={!runningPipeline ? <Play className="w-3.5 h-3.5 fill-white" /> : undefined}
          >
            {runningPipeline ? 'Running Pipeline...' : 'Run Full Pipeline'}
          </Button>
        </div>
      </div>

      {/* Live Operational Status Strip (Dark Glassmorphic) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-[#0d1428]/80 border border-white/[0.08] rounded-2xl text-xs backdrop-blur-xl shadow-lg gap-2">
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-glow-dot shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="font-semibold text-white">Live Operations:</span>
          <span className="text-slate-300">
            Everything is running normally · 13 deterministic rules active · Zero hallucination gating enabled
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Last Synced: Just now
        </div>
      </div>

      {/* Pipeline Alert Message Banner if executed */}
      {pipelineMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-3 animate-in fade-in duration-200 backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex-1 font-medium">{pipelineMessage}</div>
        </div>
      )}
    </div>
  );
}
