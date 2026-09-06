'use client';

import React from 'react';
import Link from 'next/link';
import { DriverLocation } from '@/lib/location/types';

interface SelectedDriverPanelProps {
  driver: DriverLocation;
  onClose: () => void;
  showRouteHistory: boolean;
  onToggleRouteHistory: () => void;
  isLoadingHistory?: boolean;
}

export default function SelectedDriverPanel({
  driver,
  onClose,
  showRouteHistory,
  onToggleRouteHistory,
  isLoadingHistory = false,
}: SelectedDriverPanelProps) {
  const isEmergency = driver.status === 'EMERGENCY';
  const isDelayed = driver.status === 'DELAYED';

  return (
    <div className="flex flex-col h-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                isEmergency
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isDelayed
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : driver.status === 'ACTIVE' || driver.status === 'ONLINE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {driver.status}
            </span>
            <span className="text-xs text-slate-400 font-mono">{driver.driverId}</span>
          </div>
          <h2 className="text-base font-bold text-white mt-1">{driver.driverName}</h2>
          <p className="text-xs text-slate-400">{driver.phone || '+91 98765-XXXXX'}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Close Panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Active Emergency Banner */}
      {isEmergency && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-xs font-bold text-rose-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              CRITICAL SOS DISPATCHED
            </span>
            <span>ALERT #{driver.emergencyId || 'SOS-ACTIVE'}</span>
          </div>
          <p className="text-[11px] text-rose-200">
            Driver flagged immediate roadside emergency. Escort and workshop support alerted.
          </p>
          <div className="flex gap-2 pt-1">
            <Link
              href={driver.emergencyId ? `/emergency/${driver.emergencyId}` : '/safety'}
              className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg text-center shadow transition"
            >
              Command Detail
            </Link>
            <Link
              href="/safety"
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg text-center border border-white/10 transition"
            >
              Safety Center
            </Link>
          </div>
        </div>
      )}

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Speed</span>
          <span className="text-lg font-black text-white">{Math.round(driver.speed || 0)}</span>
          <span className="text-[10px] text-slate-400 ml-1">km/h</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Heading</span>
          <span className="text-lg font-black text-white">{Math.round(driver.heading || 0)}°</span>
          <span className="text-[10px] text-slate-400 ml-1">NNE</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Battery</span>
          <span className="text-sm font-bold text-white">{driver.batteryLevel ? `${driver.batteryLevel}%` : '88%'}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">GPS Accuracy</span>
          <span className="text-sm font-bold text-white">±{Math.round(driver.accuracy || 8)}m</span>
        </div>
      </div>

      {/* Vehicle & Corridor Info */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Assigned Vehicle</span>
          <span className="font-mono font-bold text-white">{driver.vehicleId || driver.vehicleRegistration}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Corridor</span>
          <span className="font-medium text-slate-200">{driver.corridor || 'North Freight Corridor'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Coordinates</span>
          <span className="font-mono text-[11px] text-indigo-300">
            {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Last Fix</span>
          <span className="text-[11px] text-slate-400">
            {driver.timestamp || driver.lastUpdated
              ? new Date(driver.timestamp || driver.lastUpdated!).toLocaleTimeString()
              : 'Recently'}
          </span>
        </div>
      </div>

      {/* Route History Toggle */}
      <div className="pt-1">
        <button
          onClick={onToggleRouteHistory}
          disabled={isLoadingHistory}
          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition ${
            showRouteHistory
              ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-200'
              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {isLoadingHistory ? 'Fetching Route...' : showRouteHistory ? 'Hide Breadcrumbs' : 'Show Route Breadcrumbs'}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2 border-t border-white/10">
        <a
          href={`tel:${driver.phone || '+919876543210'}`}
          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition"
        >
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call Unit
        </a>
        <Link
          href={`/driver`}
          className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Driver Console
        </Link>
      </div>
    </div>
  );
}
