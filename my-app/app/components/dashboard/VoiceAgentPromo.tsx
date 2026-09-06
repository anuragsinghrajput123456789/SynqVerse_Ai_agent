'use client';

import React from 'react';
import Link from 'next/link';
import { Mic, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

export default function VoiceAgentPromo() {
  return (
    <div className="bg-[#0d1428]/70 border border-white/[0.08] hover:border-indigo-500/30 rounded-2xl p-5 shadow-lg backdrop-blur-xl hover:shadow-xl transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Subtle top right ambient gradient highlight */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-cyan-500/15 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">Voice Agent</h2>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 animate-pulse font-mono">
          MULTILINGUAL
        </span>
      </div>

      {/* Center Body with Animated Orb & Copy */}
      <div className="my-5 flex flex-col sm:flex-row items-center gap-5 relative z-10">
        {/* Animated Holographic Orb */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 animate-orb-glow flex items-center justify-center shadow-lg shadow-indigo-600/40">
            <div className="w-11 h-11 rounded-full bg-[#080c18]/40 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Mic className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="absolute -inset-1 rounded-full border border-cyan-400/40 animate-ping opacity-30 pointer-events-none" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Talk to Grafity</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Ask questions about incidents, vehicles, maintenance, and operations using natural language.
          </p>
          <p className="text-[11px] text-cyan-400 font-mono mt-1">
            English · Hindi · Hinglish
          </p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between relative z-10">
        <span className="text-[11px] text-slate-400 font-mono">Hands-free dispatcher agent</span>
        <Link href="/voice">
          <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
            Start talking
          </Button>
        </Link>
      </div>
    </div>
  );
}
