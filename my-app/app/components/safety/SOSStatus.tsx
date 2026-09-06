'use client';

import React from 'react';
import { ShieldAlert, MapPin, Clock, Truck, User, Radio } from 'lucide-react';
import { EmergencyEvent } from '@/lib/emergency/types';

interface SOSStatusProps {
  emergency: EmergencyEvent;
}

export default function SOSStatus({ emergency }: SOSStatusProps) {
  const formatTime = (timeStr: string) => {
    try {
      return new Date(timeStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ACKNOWLEDGED':
        return { label: 'Operations Acknowledged', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
      case 'RESPONDING':
        return { label: 'Help Dispatched En Route', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'RESOLVED':
        return { label: 'Emergency Resolved', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      default:
        return { label: 'Response Requested', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' };
    }
  };

  const display = getStatusDisplay(emergency.status);

  return (
    <div className="bg-[#140b18]/90 border-2 border-rose-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-rose-950/40 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Top Alert Header */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/50 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                🚨 EMERGENCY ACTIVE
              </h2>
              <span className="font-mono text-xs text-rose-300 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                {emergency.id}
              </span>
            </div>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Help is being coordinated by central operations. Stay at a safe distance from traffic.
            </p>
          </div>
        </div>

        {/* Live Location Pulsing Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/80 border border-rose-700/60 text-xs font-mono text-rose-300 shadow-sm">
          <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>GPS STREAMING</span>
        </div>
      </div>

      {/* Grid of Key Emergency Attributes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-5">
        {/* Driver */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Driver</span>
          </div>
          <p className="text-sm font-bold text-white leading-tight">
            {emergency.driverName}
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emergency.driverId}</p>
        </div>

        {/* Vehicle */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Vehicle</span>
          </div>
          <p className="text-sm font-bold text-white leading-tight font-mono">
            {emergency.vehicleRegistration}
          </p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emergency.vehicleId}</p>
        </div>

        {/* Location */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Current Location</span>
          </div>
          <p className="text-xs font-bold text-white leading-tight truncate" title={emergency.locationName}>
            {emergency.locationName || 'Highway Corridor'}
          </p>
          <p className="text-[10px] text-cyan-300 font-mono mt-0.5">
            {emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)}
          </p>
        </div>

        {/* Time Triggered */}
        <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Triggered</span>
          </div>
          <p className="text-sm font-bold text-white leading-tight font-mono">
            {formatTime(emergency.triggeredAt)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Emergency broadcast</p>
        </div>
      </div>

      {/* Live Status Bar */}
      <div className="pt-3 border-t border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold border ${display.color}`}>
            {display.label}
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Priority: <span className="font-bold text-rose-400 font-mono uppercase">CRITICAL P-0</span>
        </div>
      </div>
    </div>
  );
}
