'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import Button from '../ui/Button';

export default function CopilotPromo() {
  return (
    <div className="bg-[#0d1428]/70 border border-white/[0.08] hover:border-indigo-500/30 rounded-2xl p-5 shadow-lg backdrop-blur-xl hover:shadow-xl transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">Operations Copilot</h2>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 font-mono">
          GROUNDED RAG
        </span>
      </div>

      {/* Body */}
      <div className="my-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Operational Reasoning Assistant</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Ask why an incident was rejected, explore operational context, or understand a resolution decision.
          </p>
        </div>

        {/* Real Grounded Prompt Suggestion */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs flex items-start gap-2 text-slate-300">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span className="italic text-slate-400">
            &quot;Why did Rule R-001 trigger immediate dispatch for TRK-104 on NH-48?&quot;
          </span>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">Zero Hallucination Gating</span>
        <Link href="/copilot">
          <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
            Ask Copilot
          </Button>
        </Link>
      </div>
    </div>
  );
}
