'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  MapPin,
  Sparkles,
  Mic,
  FileSpreadsheet,
  Activity,
  BarChart3,
  CheckSquare,
  ArrowUp,
  PhoneCall,
  Lock,
  Server,
  Cpu,
  Radio,
} from 'lucide-react';
import GrafityLogo from './ui/GrafityLogo';

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-[#050811] border-t border-white/[0.08] text-slate-400 mt-20 transition-colors">
      {/* 1. Emergency Hotline & Status Banner */}
      <div className="border-b border-white/[0.06] bg-gradient-to-r from-rose-950/20 via-indigo-950/20 to-cyan-950/20 backdrop-blur-md">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide">24/7 Driver Distress & Highway SOS Dispatch</span>
              <span className="text-slate-400 block text-[11px]">
                Instant GPS distress broadcast • Hold floating pink SOS icon for 3 seconds
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-200">
              <PhoneCall className="w-3.5 h-3.5 text-pink-400" />
              <span className="font-mono font-bold text-pink-300">1800-GRAFITY-SOS</span>
              <span className="text-[10px] text-slate-400">(Toll Free)</span>
            </div>

            {/* System Status Indicators */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/5 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold text-slate-200">Systems Operational</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-mono">99.98% SLA Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Grid */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Col 1: Brand & Manifesto */}
          <div className="lg:col-span-2 space-y-4">
            <GrafityLogo size={36} showText={true} showSubtitle={true} textSize="md" glow={true} animated={true} />

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm pt-1">
              Autonomous AI logistics operations console powering high-velocity fleet dispatch, conflict resolution, real-time driver SOS telemetry, and grounded dispatch intelligence across multimodal freight corridors.
            </p>

            {/* Engine Badges */}
            <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gemini 2.5 Flash</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/5 text-slate-300">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>MongoDB Source-of-Truth</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/5 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero-PII Leak Gate</span>
              </div>
            </div>
          </div>

          {/* Col 2: Core Operations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Core Operations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:text-white transition flex items-center gap-2">
                  <span>Dashboard Console</span>
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-white transition flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Live Operations Map</span>
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
                  <span>Emergency SOS Desk</span>
                </Link>
              </li>
              <li>
                <Link href="/incidents" className="hover:text-white transition">
                  Incident Resolution Desk
                </Link>
              </li>
              <li>
                <Link href="/approvals" className="hover:text-white transition flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Human Approvals Queue</span>
                </Link>
              </li>
              <li>
                <Link href="/work-orders" className="hover:text-white transition">
                  Work Orders Synchronization
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: AI & Automation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              AI &amp; Automation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/copilot" className="hover:text-white transition flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Operations Copilot RAG</span>
                </Link>
              </li>
              <li>
                <Link href="/voice" className="hover:text-white transition flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-violet-400" />
                  <span>Multilingual Voice Agent</span>
                </Link>
              </li>
              <li>
                <Link href="/data-studio" className="hover:text-white transition flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Data Studio Ingestion</span>
                </Link>
              </li>
              <li>
                <Link href="/context" className="hover:text-white transition">
                  Unified Context Base
                </Link>
              </li>
              <li>
                <Link href="/audit" className="hover:text-white transition flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Forensic Audit Trail</span>
                </Link>
              </li>
              <li>
                <Link href="/driver" className="hover:text-white transition">
                  Driver In-Cab Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Platform &amp; SLA
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/reports" className="hover:text-white transition flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>7-Section Admin Analytics</span>
                </Link>
              </li>
              <li>
                <Link href="/api/ready" target="_blank" className="hover:text-white transition flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Readiness Probe (/api/ready)</span>
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition">
                  System Preferences
                </Link>
              </li>
              <li>
                <span className="text-slate-400 block pt-1 text-[11px]">
                  <strong>13 Rules Deterministic Engine:</strong> Rule R-001 through R-013 active.
                </span>
              </li>
              <li>
                <span className="text-slate-400 block text-[11px]">
                  <strong>Zero-Hallucination:</strong> Grounded strictly in contracts and rosters.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar: Soundwave, Copyright & Back to Top */}
      <div className="border-t border-white/[0.06] bg-[#03060c]">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          {/* Left Soundwave */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 h-3 text-cyan-400">
              {[4, 10, 6, 12, 8, 5, 11, 7, 3].map((h, i) => (
                <span
                  key={i}
                  className="w-0.5 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full animate-pulse"
                  style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
            <span className="text-slate-400 font-medium">
              Autonomous Logistics Dispatch Engine • v2.4.0 Production Release
            </span>
          </div>

          {/* Center / Right Copyright & Back to Top */}
          <div className="flex items-center gap-6 text-slate-400">
            <span>&copy; {new Date().getFullYear()} Grafity Technologies. All rights reserved.</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 hover:text-white transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-white/[0.05]"
              title="Scroll to top of page"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
