'use client';

import React from 'react';
import Link from 'next/link';
import { useEmergency } from '@/app/hooks/useEmergency';

export default function EmergencyOverview() {
  const { emergencies, stats } = useEmergency({
    pollingIntervalMs: 8000,
    autoRefresh: true,
  });

  const activeEmergencies = emergencies.filter((e) => e.status === 'ACTIVE' || e.status === 'ACKNOWLEDGED');

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${activeEmergencies.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Driver Safety & SOS</h3>
            <p className="text-[11px] text-slate-400">Emergency response triage desk</p>
          </div>
        </div>

        <Link
          href="/safety"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
        >
          View Center &rarr;
        </Link>
      </div>

      {/* Content */}
      {activeEmergencies.length === 0 ? (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Zero Active Emergencies
          </div>
          <p className="text-[11px] text-slate-400">
            All active drivers nominal. Next SOS response protocol will trigger automated notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeEmergencies.slice(0, 2).map((em) => (
            <div
              key={em.id}
              className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="text-xs font-bold text-white">{em.driverName}</span>
                  <span className="text-[10px] font-mono text-rose-300">({em.vehicleId})</span>
                </div>
                <p className="text-[11px] text-rose-200/80 truncate max-w-[200px] mt-0.5">
                  {em.notes || 'Emergency distress signal'}
                </p>
              </div>

              <Link
                href={`/emergency/${em.id}`}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow transition shrink-0"
              >
                Command
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center text-xs">
        <div>
          <span className="text-slate-400 text-[10px] block">Active SOS</span>
          <span className="font-bold text-rose-400">{stats.active}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Resolved</span>
          <span className="font-bold text-emerald-400">{stats.resolved}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] block">Avg Response</span>
          <span className="font-bold text-indigo-300">{stats.avgResponseTimeMinutes}m</span>
        </div>
      </div>
    </div>
  );
}
