'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity } from 'lucide-react';
import VoiceAgent from '../components/voice/VoiceAgent';

export default function VoiceOperationsPage() {
  return (
    <div className="relative min-h-[calc(100vh-6rem)] flex flex-col justify-between py-2 sm:py-4 bg-operations-grid animate-in fade-in duration-300">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[500px] bg-radial from-violet-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top minimal bar */}
      <div className="relative z-10 flex items-center justify-between px-2 pb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/20 text-xs text-slate-300 font-mono">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Operations Audio Stream Online</span>
        </div>
      </div>

      {/* Main Full-Screen Centerpiece Voice Agent */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full">
        <VoiceAgent isFullScreen={true} />
      </div>
    </div>
  );
}
