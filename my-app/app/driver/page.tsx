'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Radio,
  MapPin,
  Truck,
  Wifi,
  WifiOff,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import SOSButton from '../components/safety/SOSButton';
import SOSConfirmation from '../components/safety/SOSConfirmation';
import SOSStatus from '../components/safety/SOSStatus';
import { useDriverLocation } from '../hooks/useDriverLocation';
import { useEmergency } from '../hooks/useEmergency';
import { EmergencyEvent } from '@/lib/emergency/types';
import Button from '../components/ui/Button';

export default function DriverSafetyPage() {
  const driverId = 'DRV-014';
  const driverName = 'Devin Sibal';
  const vehicleReg = 'UP17GN7381'; // TRK-104
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeSOS, setActiveSOS] = useState<EmergencyEvent | null>(null);
  const [sendingSOS, setSendingSOS] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const {
    permission,
    latitude,
    longitude,
    accuracy,
    speed,
    lastUpdated,
    isOffline,
    startTracking,
  } = useDriverLocation(driverId, vehicleReg);

  const { triggerSOS, emergencies } = useEmergency();

  // Check if this driver currently has an active emergency
  useEffect(() => {
    const existing = emergencies.find(
      (e) => e.driverId === driverId && e.status !== 'RESOLVED'
    );
    if (existing) {
      setActiveSOS(existing);
    }
  }, [emergencies, driverId]);

  // Start tracking automatically on mount
  useEffect(() => {
    startTracking();
  }, [startTracking]);

  const handleConfirmSOS = async () => {
    setSendingSOS(true);
    setFeedbackMessage(null);

    const lat = latitude || 28.2045;
    const lng = longitude || 76.8320;

    const res = await triggerSOS({
      driverId,
      vehicleRegistration: vehicleReg,
      latitude: lat,
      longitude: lng,
      accuracyMeters: accuracy || 10,
      locationName: 'NH-48 Corridor (Near Manesar Toll), Haryana',
      emergencyType: 'Critical Breakdown & Roadside Hazard',
      description: 'Driver reported immediate roadside hazard. Assistance dispatched.',
    });

    setSendingSOS(false);
    setConfirmOpen(false);

    if (res.success && res.emergency) {
      setActiveSOS(res.emergency);
      setFeedbackMessage('🚨 SOS DISPATCHED: Operations command center has received your coordinates.');
    } else {
      setFeedbackMessage(`Failed to dispatch SOS: ${res.error || 'Connection error. Retrying...'}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-[calc(100vh-80px)] flex flex-col justify-between py-4 px-3 sm:px-4 select-none">
      {/* 1. Header & Navigation Back */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <Link
            href="/safety"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Operations Console</span>
          </Link>

          {/* Network & Live Signal indicator */}
          <div className="flex items-center gap-2">
            {isOffline ? (
              <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                <WifiOff className="w-3 h-3" />
                <span>OFFLINE (Queued)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                <Wifi className="w-3 h-3" />
                <span>ONLINE</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-800">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>GPS {permission === 'granted' ? 'LOCK' : 'SEARCH'}</span>
            </div>
          </div>
        </div>

        {/* Driver & Trip Dossier Card */}
        <div className="mt-4 p-4 rounded-2xl bg-[#0d1428]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold font-mono text-sm shadow-inner">
              DRV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">{driverName}</p>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                  {driverId}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                <span>{vehicleReg} (TRK-104)</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Active Trip
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">
              Delhi → Kanpur
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Permission warning if denied */}
        {permission === 'denied' && (
          <div className="mt-3 p-3 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-200 text-xs flex items-center justify-between">
            <span>Location access is required for live safety tracking.</span>
            <Button variant="secondary" size="xs" onClick={startTracking} icon={<RotateCcw className="w-3 h-3" />}>
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* 2. Main Interactive Center (SOS Button or Active SOS Banner) */}
      <div className="my-6">
        {activeSOS ? (
          <div className="space-y-4">
            <SOSStatus emergency={activeSOS} />
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                className="text-rose-300 border-rose-800 hover:bg-rose-950/50"
              >
                Send Additional Emergency Update
              </Button>
            </div>
          </div>
        ) : (
          <SOSButton
            onClick={() => setConfirmOpen(true)}
            loading={sendingSOS}
            isActive={false}
          />
        )}
      </div>

      {/* 3. Bottom Telemetry Strip */}
      <div className="p-3.5 rounded-2xl bg-[#0d1428]/80 border border-white/[0.08] backdrop-blur-xl text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Live GPS Position</span>
          </span>
          <span className="font-mono text-cyan-300 font-semibold">
            {latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'Acquiring coordinates...'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-800">
          <span>Speed: <strong className="text-slate-300 font-mono">{speed || 0} km/h</strong></span>
          <span>Accuracy: <strong className="text-slate-300 font-mono">±{accuracy ? Math.round(accuracy) : 10}m</strong></span>
          <span>Last Signal: <strong className="text-slate-300 font-mono">{lastUpdated ? 'Just now' : 'Connecting'}</strong></span>
        </div>
      </div>

      {/* Confirmation Modal */}
      <SOSConfirmation
        isOpen={confirmOpen}
        onConfirm={handleConfirmSOS}
        onCancel={() => setConfirmOpen(false)}
        loading={sendingSOS}
        latitude={latitude}
        longitude={longitude}
      />
    </div>
  );
}
