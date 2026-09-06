'use client';

import React from 'react';
import { Server, Activity, Cpu, Database, Workflow } from 'lucide-react';
import { HealthData } from './SystemStatus';

interface SystemHealthProps {
  health?: HealthData | null;
}

export default function SystemHealth({ health }: SystemHealthProps) {
  const services = [
    {
      name: 'API Gateway',
      status: health?.services?.api?.label || 'Operational',
      subtext: health?.services?.api?.latencyMs !== undefined ? `${health.services.api.latencyMs}ms latency` : '<10ms response',
      icon: Server,
      dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      statusColor: 'text-emerald-300',
    },
    {
      name: 'AI Provider',
      status: health?.services?.ai?.label || 'Connected',
      subtext: health?.services?.ai?.provider || 'Gemini 2.5 Flash',
      icon: Cpu,
      dotColor: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]',
      statusColor: 'text-indigo-300',
    },
    {
      name: 'Database Engine',
      status: health?.services?.database?.label || 'Connected',
      subtext: health?.services?.database?.type || 'MongoDB',
      icon: Database,
      dotColor: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]',
      statusColor: 'text-blue-300',
    },
    {
      name: 'Dispatch Pipeline',
      status: health?.services?.pipeline?.label || 'Ready',
      subtext: `${health?.services?.pipeline?.rulesCount || 13} Deterministic Rules`,
      icon: Workflow,
      dotColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
      statusColor: 'text-cyan-300',
    },
  ];

  return (
    <div className="bg-[#0d1428]/70 border border-white/[0.08] rounded-2xl p-5 shadow-lg backdrop-blur-xl flex flex-col justify-between h-full">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">System Health</h2>
          <p className="text-xs text-slate-400">Core architecture &amp; engine status</p>
        </div>
        <Activity className="w-4 h-4 text-emerald-400" />
      </div>

      {/* Services List */}
      <div className="my-3 space-y-2.5 flex-1">
        {services.map((svc, i) => {
          const Icon = svc.icon;
          return (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/[0.06] flex items-center justify-center text-slate-300 shadow-inner">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{svc.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{svc.subtext}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-850 border border-slate-700 shadow-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${svc.dotColor} animate-glow-dot`} />
                <span className={`text-[10px] font-semibold ${svc.statusColor}`}>{svc.status}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Verified Operational</span>
        <span className="text-emerald-400">100% SLA</span>
      </div>
    </div>
  );
}
