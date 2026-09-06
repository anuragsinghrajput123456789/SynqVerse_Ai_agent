'use client';

import React from 'react';
import { CheckCircle2, Cpu, Database, Workflow } from 'lucide-react';

export interface HealthData {
  status: string;
  timestamp: string;
  latencyMs?: number;
  services: {
    api: { status: string; label: string; latencyMs?: number };
    ai: { status: string; label: string; provider?: string };
    database: { status: string; label: string; type?: string };
    pipeline: { status: string; label: string; rulesCount?: number };
  };
}

interface SystemStatusProps {
  health?: HealthData | null;
  loading?: boolean;
}

export default function SystemStatus({ health }: SystemStatusProps) {
  const items = [
    {
      name: 'System Healthy',
      status: health?.status === 'healthy' ? 'Operational' : 'Checking...',
      icon: CheckCircle2,
      dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
      iconColor: 'text-emerald-400',
      borderHover: 'hover:border-emerald-500/40',
    },
    {
      name: 'AI Connected',
      status: health?.services?.ai?.label ?? 'Connected',
      detail: health?.services?.ai?.provider ?? 'Gemini 2.5 Flash',
      icon: Cpu,
      dotColor: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]',
      iconColor: 'text-indigo-400',
      borderHover: 'hover:border-indigo-500/40',
    },
    {
      name: 'Database Connected',
      status: health?.services?.database?.label ?? 'Connected',
      detail: health?.services?.database?.type ?? 'MongoDB',
      icon: Database,
      dotColor: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]',
      iconColor: 'text-blue-400',
      borderHover: 'hover:border-blue-500/40',
    },
    {
      name: 'Pipeline Ready',
      status: health?.services?.pipeline?.label ?? 'Ready',
      detail: `${health?.services?.pipeline?.rulesCount ?? 13} Rules Active`,
      icon: Workflow,
      dotColor: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
      iconColor: 'text-cyan-400',
      borderHover: 'hover:border-cyan-500/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`bg-[#0d1428]/70 border border-white/[0.08] p-3 rounded-2xl flex items-center justify-between backdrop-blur-xl shadow-md transition-all duration-200 ${item.borderHover}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900/90 border border-white/[0.06] flex items-center justify-center shrink-0">
                <Icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 leading-snug truncate">
                  {item.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} animate-glow-dot`} />
                  <span className="text-[11px] text-slate-400 font-medium font-mono">
                    {item.detail || item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
