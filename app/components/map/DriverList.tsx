'use client';

import React, { useState } from 'react';
import { DriverLocation } from '@/lib/location/types';

interface DriverListProps {
  drivers: DriverLocation[];
  selectedDriverId?: string | null;
  onSelectDriver: (driver: DriverLocation) => void;
  className?: string;
}

export default function DriverList({
  drivers,
  selectedDriverId,
  onSelectDriver,
  className = '',
}: DriverListProps) {
  const [filter, setFilter] = useState<'ALL' | 'EMERGENCY' | 'ACTIVE' | 'DELAYED' | 'OFFLINE'>('ALL');
  const [search, setSearch] = useState('');

  // Sort: EMERGENCY first, then ACTIVE/ONLINE, DELAYED, OFFLINE
  const sortedDrivers = [...drivers].sort((a, b) => {
    const priority: Record<string, number> = { EMERGENCY: 0, DELAYED: 1, ACTIVE: 2, ONLINE: 2, OFFLINE: 3 };
    return (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
  });

  const filteredDrivers = sortedDrivers.filter((d) => {
    if (filter !== 'ALL' && d.status !== filter) {
      if (filter === 'ACTIVE' && (d.status === 'ACTIVE' || d.status === 'ONLINE')) {
        // match active
      } else {
        return false;
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = d.driverName.toLowerCase().includes(q);
      const matchDriverId = d.driverId.toLowerCase().includes(q);
      const matchVehicle = (d.vehicleId || d.vehicleRegistration || '').toLowerCase().includes(q);
      const matchCorridor = (d.corridor || `${d.originHub || ''} ${d.destination || ''}`).toLowerCase().includes(q);
      return matchName || matchDriverId || matchVehicle || matchCorridor;
    }
    return true;
  });

  const emergencyCount = drivers.filter((d) => d.status === 'EMERGENCY').length;
  const activeCount = drivers.filter((d) => d.status === 'ACTIVE' || d.status === 'ONLINE').length;
  const delayedCount = drivers.filter((d) => d.status === 'DELAYED').length;
  const offlineCount = drivers.filter((d) => d.status === 'OFFLINE').length;

  return (
    <div className={`flex flex-col h-full bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      {/* Header & Search */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Fleet Units ({drivers.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Live Telemetry</span>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search driver, truck, route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              filter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({drivers.length})
          </button>
          <button
            onClick={() => setFilter('EMERGENCY')}
            className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1 ${
              filter === 'EMERGENCY'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
            }`}
          >
            SOS ({emergencyCount})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              filter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Moving ({activeCount})
          </button>
          <button
            onClick={() => setFilter('DELAYED')}
            className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              filter === 'DELAYED' ? 'bg-amber-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Delayed ({delayedCount})
          </button>
          <button
            onClick={() => setFilter('OFFLINE')}
            className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition ${
              filter === 'OFFLINE' ? 'bg-slate-700 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Idle ({offlineCount})
          </button>
        </div>
      </div>

      {/* Driver List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
        {filteredDrivers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No drivers found matching criteria.
          </div>
        ) : (
          filteredDrivers.map((driver) => {
            const isSelected = selectedDriverId === driver.driverId;
            const isEmergency = driver.status === 'EMERGENCY';
            const isDelayed = driver.status === 'DELAYED';

            return (
              <div
                key={driver.driverId}
                onClick={() => onSelectDriver(driver)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border border-indigo-500/50 shadow-md'
                    : isEmergency
                    ? 'bg-rose-950/30 border border-rose-500/30 hover:bg-rose-950/50'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {isEmergency && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          isEmergency
                            ? 'bg-rose-500'
                            : isDelayed
                            ? 'bg-amber-400'
                            : driver.status === 'ACTIVE' || driver.status === 'ONLINE'
                            ? 'bg-emerald-400'
                            : 'bg-slate-500'
                        }`}
                      ></span>
                    </span>
                    <span className="text-xs font-bold text-white">{driver.driverName}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
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
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-slate-300">{driver.vehicleId || driver.vehicleRegistration}</span>
                  <span>{Math.round(driver.speed || driver.speedKmH || 0)} km/h</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[150px]">{driver.corridor || 'Direct Corridor'}</span>
                  <span>
                    {driver.timestamp || driver.lastUpdated
                      ? new Date((driver.timestamp || driver.lastUpdated) as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Live'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
