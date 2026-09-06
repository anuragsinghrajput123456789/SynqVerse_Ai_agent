'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Radio,
  Navigation,
} from 'lucide-react';

interface HeroSectionProps {
  activeEmergenciesCount?: number;
  activeFleetCount?: number;
}

export default function HeroSection({
  activeEmergenciesCount = 1,
  activeFleetCount = 20,
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1224] via-slate-900 to-[#080d1a] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl space-y-8">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Micro-Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Main Section: Headline + Supporting Text + Subtle Logistics Map Graphic */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold tracking-wide">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Autonomous Logistics Orchestration Console</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Intelligence in Motion
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
            Real-time intelligence for safer, smarter logistics.
          </p>
        </div>

        {/* Subtle Map / Corridor Transit Visualization */}
        <div className="lg:col-span-5 relative">
          <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-400">
                <Navigation className="w-3 h-3" /> Live Corridor Telemetry
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {activeFleetCount} Active Units
              </span>
            </div>

            <div className="py-2">
              <svg className="w-full h-16 overflow-visible" viewBox="0 0 320 60">
                <path
                  d="M 20 30 Q 90 5 160 30 T 300 30"
                  fill="none"
                  stroke="rgba(99, 102, 241, 0.3)"
                  strokeWidth="2.5"
                  strokeDasharray="4, 4"
                />
                <path
                  d="M 20 30 Q 90 5 160 30 T 300 30"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="30, 90"
                  className="animate-pulse"
                />
                <circle cx="20" cy="30" r="5" fill="#10b981" />
                <text x="20" y="50" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Delhi Hub
                </text>

                <circle cx="160" cy="30" r="5" fill="#f43f5e" />
                <text x="160" y="50" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">
                  NH-48 Corridor
                </text>

                <circle cx="300" cy="30" r="5" fill="#06b6d4" />
                <text x="300" y="50" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Kanpur Depot
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Dedicated Operational Feature Cards specified in prompt */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
        {/* Card 1: AI OPERATIONS */}
        <div className="group rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 hover:border-indigo-500/40 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/60">
                AI Operations
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              AI Operations
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Understand and resolve incidents faster with grounded context.
            </p>
          </div>

          <Link
            href="/copilot"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-white transition-colors group/btn pt-2 border-t border-white/5"
          >
            <span>Open Copilot</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 2: LIVE FLEET */}
        <div className="group rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 hover:border-cyan-500/40 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/60">
                Live Radar
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              Live Fleet
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              See your vehicles and drivers in real time across active corridors.
            </p>
          </div>

          <Link
            href="/map"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-white transition-colors group/btn pt-2 border-t border-white/5"
          >
            <span>View Live Map</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 3: DRIVER SAFETY */}
        <div className="group rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 hover:border-pink-500/40 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/10 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-pink-400 flex items-center justify-center border border-pink-500/30 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              {activeEmergenciesCount > 0 ? (
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-700/60 animate-pulse">
                  {activeEmergenciesCount} Active Alert
                </span>
              ) : (
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800">
                  Ready
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
              Driver Safety
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Emergency assistance in one tap with automatic dispatch coordinates.
            </p>
          </div>

          <Link
            href="/safety"
            className="inline-flex items-center gap-2 text-xs font-semibold text-pink-400 hover:text-white transition-colors group/btn pt-2 border-t border-white/5"
          >
            <span>Safety Center</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
