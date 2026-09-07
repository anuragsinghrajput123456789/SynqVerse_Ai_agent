'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Radio,
  Activity,
  Zap,
  TrendingUp,
  Cpu,
  Gauge,
} from 'lucide-react';
import GrafityLogo from '../ui/GrafityLogo';

interface HeroSectionProps {
  activeEmergenciesCount?: number;
  activeFleetCount?: number;
}

export default function HeroSection({
  activeEmergenciesCount = 1,
  activeFleetCount = 20,
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#060a16] border border-cyan-500/20 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.8),0_0_35px_rgba(0,240,255,0.12)] p-6 sm:p-8 lg:p-10 space-y-8">
      {/* Dynamic Ambient Background Glows inspired by the pic */}
      <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-[30rem] h-[30rem] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-28 left-1/3 w-[28rem] h-[28rem] bg-pink-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Micro-Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* 1. Top Section: Grand Logo + Brand Headline + Actions */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AUTONOMOUS LOGISTICS ORCHESTRATION CONSOLE</span>
          </div>

          {/* Grafity Logo and Wordmark directly from Brand Asset */}
          <div className="pt-1">
            <GrafityLogo
              size={54}
              showText={true}
              showSubtitle={true}
              textSize="xl"
              glow={true}
              animated={true}
            />
          </div>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            Real-time intelligence for safer, smarter logistics. High-frequency telemetry, zero-hallucination multimodal dispatch, and deterministic highway emergency response across Tier-1 supply chains.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/copilot"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>Launch Copilot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-xs sm:text-sm font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.1)]"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Live Fleet Radar</span>
            </Link>

            <Link
              href="/safety"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-pink-300 border border-pink-500/30 hover:border-pink-400 text-xs sm:text-sm font-bold transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-pink-400" />
              <span>Driver Safety SOS</span>
            </Link>
          </div>
        </div>

        {/* 2. Top Right: Live HUD Telemetry Card from Image */}
        <div className="lg:col-span-5 relative">
          <div className="rounded-2xl bg-gradient-to-br from-[#0c1428]/95 to-[#060b18]/95 border border-cyan-500/30 p-5 backdrop-blur-xl shadow-[0_0_25px_rgba(0,240,255,0.15)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
                  REAL-TIME TELEMETRY HUD
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                1,450 TRUCKS ACTIVE
              </span>
            </div>

            {/* Metrics Row from Image */}
            <div className="grid grid-cols-2 gap-3">
              {/* Metric 1: SLA Metrics 99.8% */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/20">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                  <span>SLA Turnaround</span>
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-xl font-black text-cyan-300 font-mono tracking-tight">
                  99.8%
                </div>
                {/* SVG Spline curve matching image */}
                <div className="h-6 mt-1.5 w-full">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24">
                    <path
                      d="M 0 18 Q 20 4, 40 14 T 80 8 T 100 6"
                      fill="none"
                      stroke="#00F0FF"
                      strokeWidth="2"
                    />
                    <path
                      d="M 0 18 Q 20 4, 40 14 T 80 8 T 100 6 L 100 24 L 0 24 Z"
                      fill="url(#splineCyanGrad)"
                      opacity="0.3"
                    />
                    <defs>
                      <linearGradient id="splineCyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Metric 2: Fleet Optimization 94% */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-purple-500/20">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                  <span>Fleet Efficiency</span>
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-xl font-black text-purple-300 font-mono tracking-tight">
                  94%
                </div>
                {/* Gauge ring */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                      style={{ width: '94%' }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Optimal</span>
                </div>
              </div>
            </div>

            {/* Live Corridor Status */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>NH-48 Golden Corridor</span>
              </span>
              <span className="text-emerald-400 font-bold">Latency: 6ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Centerpiece: The Hero Banner Asset from User Pic */}
      <div className="relative z-10 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_35px_rgba(0,240,255,0.18)] group">
        <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] max-h-[460px]">
          <Image
            src="/assets/grafity_hero_banner.jpg"
            alt="Grafity Smart Logistics Autonomous AI Operations"
            fill
            priority
            className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-700"
          />

          {/* Subtle Cyber Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060a16] via-transparent to-transparent opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060a16]/60 via-transparent to-[#060a16]/60" />

          {/* Floating HUD Badges directly over the image */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#060a16]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 text-xs font-mono text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30 animate-pulse" />
            <span className="font-bold">LIVE TELEMETRY STREAM</span>
          </div>

          <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2 bg-[#060a16]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-500/40 text-xs font-mono text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span className="font-bold">13 RULES DETERMINISTIC ENGINE</span>
          </div>

          {/* Bottom Bar on the Image */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between bg-[#060a16]/85 backdrop-blur-lg px-4 py-2.5 rounded-xl border border-white/10 text-xs">
            <div className="flex items-center gap-4 text-slate-300">
              <span className="font-bold text-white flex items-center gap-1.5">
                <GrafityLogo size={18} glow={false} />
                <span>GRAFITY HIGHWAY RADAR</span>
              </span>
              <span className="hidden md:inline text-slate-400">
                Delhi • Gurugram • Jaipur • Kanpur • Mumbai Corridors
              </span>
            </div>

            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              <span>Explore Live Telemetry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. The 3 Dedicated Operational Feature Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
        {/* Card 1: AI OPERATIONS (Grounded Copilot) */}
        <div className="group rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-indigo-500/25 hover:border-indigo-400/50 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(99,102,241,0.2)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800/60">
                Gemini 2.5 Flash
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              AI Operations Copilot
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Targeted RAG retrieval grounded in fleet, client SLA, and driver roster contracts with clickable source citations.
            </p>
          </div>

          <Link
            href="/copilot"
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-200 transition-colors group/btn pt-2 border-t border-white/5"
          >
            <span>Open Copilot</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 2: LIVE FLEET (Live Radar) */}
        <div className="group rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-cyan-500/25 hover:border-cyan-400/50 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,240,255,0.2)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60">
                180 Packets / Min
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              Live Fleet Telemetry
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Interactive GIS map with real-time GPS coordinates, speed metrics, route corridor tracking, and driver assignments.
            </p>
          </div>

          <Link
            href="/map"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-200 transition-colors group/btn pt-2 border-t border-white/5"
          >
            <span>View Live Map</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 3: DRIVER SAFETY (SOS Highway Rescue) */}
        <div className="group rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-pink-500/25 hover:border-pink-400/50 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(236,72,153,0.2)] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center border border-pink-500/30 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              {activeEmergenciesCount > 0 ? (
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-700/60 animate-pulse">
                  {activeEmergenciesCount} Active Distress
                </span>
              ) : (
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  Corridor Clear
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
              Driver Safety & SOS
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              3-second press-and-hold distress trigger with haptic feedback, 15-minute idempotent deduplication, and rescue dispatch.
            </p>
          </div>

          <Link
            href="/safety"
            className="inline-flex items-center gap-2 text-xs font-semibold text-pink-400 hover:text-pink-200 transition-colors group/btn pt-2 border-t border-white/5"
          >
            <span>Safety Center</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
