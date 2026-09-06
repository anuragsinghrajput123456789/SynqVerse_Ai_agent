'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useEmergency } from '../hooks/useEmergency';
import EmergencyCard from '../components/safety/EmergencyCard';

export default function SafetyCenterPage() {
  const { emergencies, stats, isLoading, error, refresh, acknowledgeSOS, resolveSOS } = useEmergency({
    pollingIntervalMs: 5000,
    autoRefresh: true,
  });

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const filteredEmergencies = emergencies.filter((em) => {
    if (filterStatus !== 'ALL' && em.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = em.id.toLowerCase().includes(q);
      const matchDriver = em.driverName.toLowerCase().includes(q) || em.driverId.toLowerCase().includes(q);
      const matchVehicle = em.vehicleId.toLowerCase().includes(q);
      const matchNotes = (em.notes || em.description || '').toLowerCase().includes(q);
      return matchId || matchDriver || matchVehicle || matchNotes;
    }
    return true;
  });

  const activeCount = emergencies.filter((e) => e.status === 'ACTIVE').length;
  const ackCount = emergencies.filter((e) => e.status === 'ACKNOWLEDGED' || e.status === 'RESPONDING').length;
  const resolvedCount = emergencies.filter((e) => e.status === 'RESOLVED').length;

  const handleAcknowledge = async (id: string) => {
    setActionInProgress(id);
    await acknowledgeSOS(id, 'DISPATCHER-HQ', 'Operations desk acknowledged SOS. Unit notified and escort alerted.');
    setActionInProgress(null);
  };

  const handleResolve = async (id: string) => {
    setActionInProgress(id);
    await resolveSOS(id, 'DISPATCHER-HQ', 'Emergency resolved on-site. Vehicle secured.');
    setActionInProgress(null);
  };

  return (
    <div className="min-h-screen bg-[#080c18] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Alert if Active SOS exists */}
      {activeCount > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/80 via-red-900/60 to-amber-950/80 border border-rose-500/50 p-4 sm:p-5 shadow-2xl shadow-rose-950/50 animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  CRITICAL INCIDENT ACTIVE: {activeCount} Unacknowledged Driver SOS Alert{activeCount > 1 ? 's' : ''}
                </h2>
                <p className="text-xs sm:text-sm text-rose-200/90">
                  Immediate operations triage required. Field rescue protocols activated.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilterStatus('ACTIVE')}
                className="flex-1 sm:flex-none px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow transition"
              >
                Focus Active ({activeCount})
              </button>
              <Link
                href="/map"
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-600/50 text-center transition"
              >
                Live Map
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
              Emergency Operations Desk
            </span>
            <span className="text-xs text-slate-400">• Live Ingestion Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-3">
            Driver Safety & Emergency Triage
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time SOS telemetry, driver security escalation, and incident command logs.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:border-slate-500 text-xs font-medium text-slate-200 flex items-center gap-2 transition disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <Link
            href="/map"
            className="px-3.5 py-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 hover:bg-indigo-600/50 text-xs font-medium text-indigo-200 flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Full Map View
          </Link>
          <Link
            href="/driver"
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Driver Mobile App
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Alerts</span>
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.total}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Recorded across all corridors</p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition ${
          activeCount > 0
            ? 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-950/30'
            : 'glass-panel border-white/10'
        }`}>
          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
            <span>Active SOS</span>
            <span className="relative flex h-2.5 w-2.5">
              {activeCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-400">{stats.active}</span>
            <p className="text-[11px] text-rose-300/70 mt-0.5">Awaiting triage action</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>Acknowledged</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{ackCount}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Response teams engaged</p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span>Resolved</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.resolved}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Safely concluded</p>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-indigo-300">
            <span>Avg Response Time</span>
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-300">{stats.avgResponseTimeMinutes}m</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Target SLA: &lt; 5.0m</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Incidents' : st}
              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-black/30">
                {st === 'ALL'
                  ? emergencies.length
                  : st === 'ACTIVE'
                  ? activeCount
                  : st === 'ACKNOWLEDGED'
                  ? ackCount
                  : resolvedCount}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search driver, vehicle, SOS ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Emergency List View */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
          Error loading safety incidents: {error}
        </div>
      )}

      {filteredEmergencies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-white">All Fleets Nominal</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No emergency alerts matching filter criteria. All active drivers reporting safe status across network corridors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmergencies.map((emergency) => (
            <EmergencyCard
              key={emergency.id}
              emergency={emergency}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              isLoading={actionInProgress === emergency.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
