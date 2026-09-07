'use client';

import React from 'react';
import Link from 'next/link';
import { useEmergency } from '@/app/hooks/useEmergency';
import { ShieldAlert, ArrowRight, PhoneCall, CheckCircle2 } from 'lucide-react';

export default function EmergencyOverview() {
  const { emergencies } = useEmergency({
    pollingIntervalMs: 8000,
    autoRefresh: true,
  });

  const activeEmergencies = emergencies.filter((e) => e.status === 'ACTIVE' || e.status === 'ACKNOWLEDGED');

  return (
    <div className="cyber-card-pink p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${activeEmergencies.length > 0 ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-[0_0_12px_rgba(236,72,153,0.3)]' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>Driver Safety Desk</span>
              {activeEmergencies.length > 0 ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse font-bold">
                  {activeEmergencies.length} ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  CLEAR
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">Highway SOS telemetry &amp; emergency rescue dispatch</p>
          </div>
        </div>

        <Link
          href="/safety"
          className="text-xs font-semibold text-pink-400 hover:text-pink-300 transition flex items-center gap-1 group font-mono"
        >
          <span>Safety Center</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Content */}
      {activeEmergencies.length === 0 ? (
        <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-300 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Zero Active Highway Distress Signals
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            All active fleet drivers are reporting nominal GPS coordinates. 3-second SOS triggers will immediately page nearest highway depots.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeEmergencies.slice(0, 2).map((em) => (
            <div
              key={em.id}
              className="p-3.5 rounded-xl bg-pink-950/40 border border-pink-500/40 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
                  </span>
                  <span className="text-xs font-bold text-white font-mono">{em.id}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {em.priority || em.severity || 'HIGH'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Driver: <strong className="text-white">{em.driverName || em.driverId || 'Assigned Driver'}</strong> • Vehicle: <strong className="text-white">{em.vehicleRegistration || em.vehicleId || 'Fleet Unit'}</strong>
                </div>
              </div>

              <Link
                href={`/emergency/${em.id}`}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition shadow-[0_0_10px_rgba(236,72,153,0.3)]"
              >
                Triage
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Action footer */}
      <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <PhoneCall className="w-3.5 h-3.5 text-pink-400" />
          Distress Hotline: 1800-GRAFITY-SOS
        </span>
        <Link
          href="/safety"
          className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/40 text-xs font-semibold transition shadow-[0_0_12px_rgba(236,72,153,0.2)]"
        >
          View Incident Log
        </Link>
      </div>
    </div>
  );
}
