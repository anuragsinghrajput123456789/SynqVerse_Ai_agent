'use client';

import React from 'react';
import { Database } from 'lucide-react';
import Badge from '../ui/Badge';

export interface CopilotSourceItem {
  title: string;
  authority: string;
  snippet: string;
  ruleId?: string;
}

interface CopilotSourceDrawerProps {
  activeSources: CopilotSourceItem[];
}

export default function CopilotSourceDrawer({ activeSources }: CopilotSourceDrawerProps) {
  return (
    <div className="lg:col-span-3 hidden lg:flex flex-col justify-between rounded-3xl glass-panel border border-slate-800 p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Context &amp; Provenance
          </h3>
        </div>

        <p className="text-[11px] text-slate-400 mt-2">
          Verified records retrieved and evaluated by the deterministic engine for the active answer.
        </p>

        <div className="space-y-3 mt-4">
          {activeSources.map((src, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-mono">{src.title}</span>
                <Badge variant="cyan">{src.authority}</Badge>
              </div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                &ldquo;{src.snippet}&rdquo;
              </p>
              {src.ruleId && (
                <div className="pt-1">
                  <span className="text-[10px] text-purple-400 font-mono font-semibold">
                    Enforced Override: {src.ruleId}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 text-center">
        Grounding Score: <span className="text-emerald-400 font-bold font-mono">1.00 / 1.00</span>
      </div>
    </div>
  );
}
