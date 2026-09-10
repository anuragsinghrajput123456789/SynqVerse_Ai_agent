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
  Cpu,
  Navigation,
  CheckCircle2,
  Zap,
  Gauge,
  Satellite,
  ShieldCheck,
} from 'lucide-react';
import GrafityLogo from '../ui/GrafityLogo';
import HeroFeatureCard from './HeroFeatureCard';
import { useLiveFleet } from '@/app/hooks/useLiveFleet';
import { useEmergency } from '@/app/hooks/useEmergency';

interface HeroSectionProps {
  activeEmergenciesCount?: number;
  activeFleetCount?: number;
}

export default function HeroSection({
  activeEmergenciesCount,
  activeFleetCount,
}: HeroSectionProps) {
  // Pull live fleet data as fallback if not explicitly passed as props
  const { stats: fleetStats } = useLiveFleet({
    useSSE: false,
    pollingIntervalMs: 12000,
  });

  const { emergencies } = useEmergency({
    pollingIntervalMs: 10000,
    autoRefresh: true,
  });

  const resolvedFleetCount = activeFleetCount ?? fleetStats.active;
  const activeEmergencies = emergencies.filter(
    (e) => e.status === 'ACTIVE' || e.status === 'ACKNOWLEDGED' || e.status === 'RESPONDING'
  );
  const resolvedEmergenciesCount = activeEmergenciesCount ?? activeEmergencies.length;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b1226]/95 via-[#070c1c]/95 to-[#040814]/98 border border-cyan-500/25 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(0,240,255,0.08)] p-6 sm:p-8 lg:p-10 space-y-8 backdrop-blur-2xl transition-all duration-300">
      {/* 0. Ambient Cinematic Backdrop & Neon Nebula Lighting */}
      {/* Blended High-Tech Highway Logistics Banner */}
      <div className="absolute top-0 right-0 w-full lg:w-3/5 h-full opacity-25 pointer-events-none overflow-hidden select-none">
        <Image
          src="/assets/grafity_hero_banner.jpg"
          alt="Grafity Highway Logistics"
          fill
          priority
          className="object-cover object-right opacity-70 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1226] via-[#0b1226]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040814] via-transparent to-[#0b1226]/60" />
      </div>

      {/* Cybernetic Ambient Grid Pattern */}
      <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />

      {/* Glowing Neon Colored Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[110px] pointer-events-none" />

      {/* 1. Top Section: Headline, Brand & Live Telemetry HUD */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Brand, Headline, Paragraph, and Actions */}
        <div className="lg:col-span-7 space-y-5">
          {/* Live System Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-400/35 text-cyan-300 text-xs font-semibold shadow-[0_0_15px_rgba(0,240,255,0.18)] backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-200">
              AUTONOMOUS AI LOGISTICS ENGINE • LIVE RADAR &amp; DISPATCH
            </span>
          </div>

          {/* Logo & Headline */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <GrafityLogo size={48} glow={true} animated={true} />
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-sans text-white">
                  Intelligence in{' '}
                  <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                    Motion
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
              Real-time autonomous operations console powering high-frequency highway emergency dispatch, deterministic SLA conflict resolution, and intelligent IoT fleet telemetry across India&apos;s primary freight corridors.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/copilot"
              className="inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-[0_0_22px_rgba(0,240,255,0.35)] hover:shadow-[0_0_32px_rgba(0,240,255,0.6)] hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <Cpu className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
              <span>Launch Copilot</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/60 text-xs sm:text-sm font-semibold shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all cursor-pointer group"
            >
              <MapPin className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Live Fleet Radar</span>
            </Link>

            <Link
              href="/safety"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-400/60 text-xs sm:text-sm font-semibold shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all cursor-pointer group"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:animate-bounce" />
              <span>Driver Safety SOS</span>
            </Link>
          </div>

          {/* Operational Micro-Ribbon Strip */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>NH-48 • NH-19 Active</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>99.98% Telemetry Lock</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Satellite className="w-3.5 h-3.5" />
              <span>10Hz GPS Sync</span>
            </span>
          </div>
        </div>

        {/* Right Column: High-Tech Cyber Telemetry & Autonomous Truck Showcase */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-2xl bg-gradient-to-b from-[#0e172e]/95 to-[#080d1e]/95 border border-cyan-500/30 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(0,240,255,0.12)] space-y-4 backdrop-blur-xl overflow-hidden group">
            {/* Cyber Corner HUD Accent Marks */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/70 pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/70 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/70 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/70 pointer-events-none" />

            {/* Header: Telemetry Status */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-xs font-bold text-cyan-200 tracking-wider">
                  TELEMETRY CONTROLLER
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                {resolvedFleetCount} {resolvedFleetCount === 1 ? 'UNIT TRACKED' : 'UNITS TRACKED'}
              </span>
            </div>

            {/* Featured Visual: Autonomous Freight Truck with Real-Time HUD Overlay */}
            <div className="relative h-36 w-full rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950 shadow-inner group/truck">
              <Image
                src="/truck.jpg"
                alt="Cyberpunk Heavy Freight Truck"
                fill
                sizes="(max-width: 1024px) 100vw, 450px"
                className="object-cover object-center group-hover/truck:scale-105 transition-transform duration-700 opacity-85"
              />
              {/* Cyan / Dark Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080d1e] via-transparent to-black/40" />

              {/* Laser Scanning Line Animation */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75 animate-scanline pointer-events-none shadow-[0_0_8px_#00f0ff]" />

              {/* Overlaid HUD Tags */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/75 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 backdrop-blur-md flex items-center gap-1">
                <Navigation className="w-3 h-3 text-cyan-400" />
                <span>DEL → MUM CORRIDOR</span>
              </div>

              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-950/75 border border-white/10 text-[10px] font-mono text-emerald-400 backdrop-blur-md flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                <span>68 KM/H</span>
              </div>

              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-white/10 text-[9px] font-mono text-slate-300 backdrop-blur-md">
                GPS: 28.6139° N, 77.2090° E
              </div>

              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 backdrop-blur-md">
                LOCK 100%
              </div>
            </div>

            {/* Authentic Live Status Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Fleet Movement KPI */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span>Fleet Movement</span>
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                  {resolvedFleetCount}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Telemetry Live</span>
                </div>
              </div>

              {/* Emergency SOS KPI */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-rose-500/40 transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span>Emergency SOS</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-2xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                  {resolvedEmergenciesCount}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium">
                  {resolvedEmergenciesCount > 0 ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      Active Alerts
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Corridor Clear
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Live Corridor Status Indicator */}
            <div className="pt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>NH-48 • NH-19 Active Corridors</span>
              </span>
              <span className="text-emerald-400 font-bold text-[11px]">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Corridor Route Geometric Visualization in Cyber Dark Mode */}
      <div className="relative z-10 rounded-2xl bg-gradient-to-b from-[#0a1226]/90 to-[#060b18]/95 border border-cyan-500/25 p-5 shadow-lg overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-200 font-mono">
              Strategic Highway Freight Corridors (India)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Delhi — Gurugram — Jaipur — Kanpur — Mumbai (Golden Quad)
          </span>
        </div>

        {/* SVG Transit Visualization */}
        <div className="w-full h-24 sm:h-28 relative">
          <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <defs>
              {/* Glowing filters */}
              <filter id="corridorGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="corridorGlowViolet" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Highway Grid Line */}
            <line x1="0" y1="50" x2="1000" y2="50" stroke="#1e293b" strokeWidth="2" strokeDasharray="6 6" />

            {/* Active Corridor Paths with Neon Glow */}
            <path
              d="M 60 50 Q 250 20, 500 50 T 940 50"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#corridorGlowCyan)"
            />
            <path
              d="M 60 50 Q 250 80, 500 50 T 940 50"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              filter="url(#corridorGlowViolet)"
            />

            {/* Animated vehicle signal blips traveling across corridor */}
            <circle cx="200" cy="30" r="3.5" fill="#ffffff" filter="url(#corridorGlowCyan)">
              <animate attributeName="cx" values="60;280;500;720;940" dur="8s" repeatCount="indefinite" />
              <animate attributeName="cy" values="50;38;50;62;50" dur="8s" repeatCount="indefinite" />
            </circle>

            <circle cx="650" cy="55" r="3" fill="#38bdf8" filter="url(#corridorGlowCyan)">
              <animate attributeName="cx" values="940;720;500;280;60" dur="11s" repeatCount="indefinite" />
              <animate attributeName="cy" values="50;62;50;38;50" dur="11s" repeatCount="indefinite" />
            </circle>

            {/* Node 1: Delhi */}
            <circle cx="60" cy="50" r="8" fill="#060b18" stroke="#00f0ff" strokeWidth="3" filter="url(#corridorGlowCyan)" />
            <circle cx="60" cy="50" r="3.5" fill="#00f0ff" />

            {/* Node 2: Gurugram */}
            <circle cx="280" cy="38" r="7" fill="#060b18" stroke="#38bdf8" strokeWidth="2.5" filter="url(#corridorGlowCyan)" />
            <circle cx="280" cy="38" r="3" fill="#38bdf8" />

            {/* Node 3: Jaipur */}
            <circle cx="500" cy="50" r="8" fill="#060b18" stroke="#8b5cf6" strokeWidth="3" filter="url(#corridorGlowViolet)" />
            <circle cx="500" cy="50" r="3.5" fill="#a855f7" />

            {/* Node 4: Kanpur */}
            <circle cx="720" cy="62" r="7" fill="#060b18" stroke="#ec4899" strokeWidth="2.5" />
            <circle cx="720" cy="62" r="3" fill="#ec4899" />

            {/* Node 5: Mumbai */}
            <circle cx="940" cy="50" r="8" fill="#060b18" stroke="#00f0ff" strokeWidth="3" filter="url(#corridorGlowCyan)" />
            <circle cx="940" cy="50" r="3.5" fill="#00f0ff" />
          </svg>

          {/* Hub Labels positioned across corridor */}
          <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 sm:px-6 text-[11px] font-mono font-semibold text-slate-300">
            <span className="text-left text-cyan-300">Delhi Hub</span>
            <span className="hidden sm:inline text-sky-300">Gurugram Depots</span>
            <span className="text-center text-purple-300">Jaipur Junction</span>
            <span className="hidden sm:inline text-pink-300">Kanpur Terminal</span>
            <span className="text-right text-cyan-300">Mumbai Gateway</span>
          </div>
        </div>
      </div>

      {/* 3. Three Dedicated Feature Cards with Visual Imagery & Dark Theme */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: AI Operations & Copilot */}
        <HeroFeatureCard
          title="Autonomous Dispatch & Context Routing"
          description="Autonomous dispatch & contextual exception routing grounded in client SLAs, vehicle capacities, and driver safety limits."
          badge="AI OPERATIONS"
          badgeColor="indigo"
          icon={<Sparkles className="w-5 h-5 text-indigo-300" />}
          imageSrc="/assets/grafity_copilot_voice.jpg"
          imageAlt="Grafity AI Copilot & Voice Interface"
          highlightText="RAG ENGINE ACTIVE"
          href="/copilot"
          actionText="Launch Copilot"
        />

        {/* Card 2: Live Fleet Radar */}
        <HeroFeatureCard
          title="Dynamic Telemetry & Route Optimization"
          description="Dynamic telemetry & real-time route optimization with active geospatial tracking, automated rerouting, and freshness states."
          badge="LIVE FLEET"
          badgeColor="cyan"
          icon={<MapPin className="w-5 h-5 text-cyan-300" />}
          imageSrc="/assets/grafity_live_map_sos.jpg"
          imageAlt="Grafity Live Radar & Tactical Map"
          highlightText="10HZ REFRESH"
          href="/map"
          actionText="View Live Radar"
        />

        {/* Card 3: Driver Safety SOS */}
        <HeroFeatureCard
          title="Proactive SOS & Fatigue Prevention"
          description="Proactive SOS escalation & fatigue prevention with press-and-hold triggers, deduplication, and highway depot rescue dispatch."
          badge="DRIVER SAFETY"
          badgeColor="rose"
          icon={<ShieldAlert className="w-5 h-5 text-rose-300" />}
          imageSrc="/truck.jpg"
          imageAlt="Heavy Freight Emergency Fleet"
          highlightText="3S SOS TRIGGER"
          href="/safety"
          actionText="Safety Center"
        />
      </div>
    </div>
  );
}
