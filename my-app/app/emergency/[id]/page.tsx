'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EmergencyEvent } from '@/lib/emergency/types';
import EmergencyTimeline from '@/app/components/safety/EmergencyTimeline';
import { DriverLocation } from '@/lib/location/types';

// Dynamic Leaflet Map for SSR safety
const MapView = dynamic(() => import('@/app/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 flex items-center justify-center bg-slate-950 rounded-2xl border border-white/10 text-slate-500 text-xs">
      Loading Incident Coordinates...
    </div>
  ),
});

interface EmergencyAuditLog {
  action?: string;
  eventType?: string;
  timestamp: string;
  actor?: string;
  entityId?: string;
}

export default function EmergencyCommandDetailPage() {
  const params = useParams();
  const emergencyId = params?.id as string;

  const [emergency, setEmergency] = useState<EmergencyEvent | null>(null);
  const [auditTrail, setAuditTrail] = useState<EmergencyAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  const fetchIncident = useCallback(async () => {
    if (!emergencyId) return;
    try {
      const res = await fetch(`/api/emergency/${encodeURIComponent(emergencyId)}`);
      if (!res.ok) {
        throw new Error(`Incident not found (${res.status})`);
      }
      const data = await res.json();
      setEmergency(data.emergency);
      setAuditTrail(data.auditTrail || []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incident details');
    } finally {
      setIsLoading(false);
    }
  }, [emergencyId]);

  useEffect(() => {
    fetchIncident();
    // Poll updates every 6 seconds
    const timer = setInterval(fetchIncident, 6000);
    return () => clearInterval(timer);
  }, [fetchIncident]);

  const handleAcknowledge = async () => {
    if (!emergency) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/emergency/${emergency.id}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acknowledgedBy: 'HQ-DISPATCHER-COMMAND',
          notes: 'Operations Command acknowledged SOS. Escort unit alerted.',
        }),
      });
      if (res.ok) {
        await fetchIncident();
      }
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!emergency) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/emergency/${emergency.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolvedBy: 'HQ-DISPATCHER-COMMAND',
          resolutionNotes: resolveNotes || 'Emergency safely resolved on-site. Fleet unit back in service.',
        }),
      });
      if (res.ok) {
        setShowResolveModal(false);
        await fetchIncident();
      }
    } catch (err) {
      console.error('Failed to resolve:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080c18] flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Emergency Command Dossier...</span>
        </div>
      </div>
    );
  }

  if (error || !emergency) {
    return (
      <div className="min-h-screen bg-[#080c18] p-8 text-center space-y-4">
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 max-w-md mx-auto text-rose-300">
          <h2 className="text-base font-bold">Incident Not Found</h2>
          <p className="text-xs mt-1 text-rose-300/80">{error || `No emergency record for ID ${emergencyId}`}</p>
          <Link
            href="/safety"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
          >
            Return to Safety Center
          </Link>
        </div>
      </div>
    );
  }

  const isEmergencyActive = emergency.status === 'ACTIVE';
  const isAcknowledged = emergency.status === 'ACKNOWLEDGED' || emergency.status === 'RESPONDING';
  const isResolved = emergency.status === 'RESOLVED';

  // Driver Location object for Leaflet Map
  const mapDriverLocation: DriverLocation = {
    driverId: emergency.driverId,
    driverName: emergency.driverName,
    vehicleRegistration: emergency.vehicleRegistration || emergency.vehicleId,
    vehicleId: emergency.vehicleId,
    latitude: emergency.latitude,
    longitude: emergency.longitude,
    speed: emergency.speed || 0,
    heading: 0,
    status: isResolved ? 'ACTIVE' : 'EMERGENCY',
    emergencyId: emergency.id,
    timestamp: emergency.createdAt,
    phone: emergency.driverPhone,
  };

  return (
    <div className="min-h-screen bg-[#080c18] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/safety"
            className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Back to Safety Center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">{emergency.id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isEmergencyActive
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : isAcknowledged
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {emergency.status}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                {emergency.severity || emergency.priority}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Incident Command Detail: {emergency.driverName}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isEmergencyActive && (
            <button
              onClick={handleAcknowledge}
              disabled={isActionLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 transition disabled:opacity-50"
            >
              {isActionLoading ? 'Processing...' : 'Acknowledge Incident'}
            </button>
          )}

          {!isResolved && (
            <button
              onClick={() => setShowResolveModal(true)}
              disabled={isActionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              Mark as Resolved
            </button>
          )}

          <Link
            href={`/map?driver=${emergency.driverId}`}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-white/10 transition"
          >
            Live Fleet Radar
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Dossier + Map, Right Timeline + Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Map & Driver Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leaflet GPS Coordinates Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Incident GPS Location
              </span>
              <span className="font-mono text-indigo-300">
                Lat: {emergency.latitude.toFixed(5)}, Lng: {emergency.longitude.toFixed(5)}
              </span>
            </div>

            <div className="h-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <MapView
                drivers={[mapDriverLocation]}
                selectedDriverId={emergency.driverId}
                center={[emergency.latitude, emergency.longitude]}
                zoom={14}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Driver & Telemetry Dossier */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Telemetry & Personnel Dossier
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Driver</span>
                <span className="text-xs font-bold text-white block mt-0.5">{emergency.driverName}</span>
                <span className="text-[11px] font-mono text-slate-400">{emergency.driverId}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Driver Phone</span>
                <a
                  href={`tel:${emergency.driverPhone || '+919876543210'}`}
                  className="text-xs font-bold text-indigo-400 hover:underline block mt-0.5"
                >
                  {emergency.driverPhone || '+91 98765-XXXXX'}
                </a>
                <span className="text-[10px] text-slate-500">Click to dial</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Vehicle Assigned</span>
                <span className="text-xs font-bold text-white font-mono block mt-0.5">
                  {emergency.vehicleId}
                </span>
                <span className="text-[10px] text-slate-500">Heavy Carrier</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block uppercase">Reported Speed</span>
                <span className="text-xs font-bold text-white block mt-0.5">
                  {Math.round(emergency.speed || 0)} km/h
                </span>
                <span className="text-[10px] text-emerald-400">Stationary</span>
              </div>
            </div>

            {/* Notes / Incident Description */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Reported Conditions & Notes
              </span>
              <p className="text-xs text-slate-200">
                {emergency.notes || emergency.description || 'One-click SOS triggered via driver mobile interface.'}
              </p>
              {(emergency.breakdownId || emergency.relatedIncidentId) && (
                <p className="text-[11px] text-amber-400 pt-1">
                  Linked Breakdown ID: <span className="font-mono font-bold">{emergency.breakdownId || emergency.relatedIncidentId}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Response Timeline & Forensic Audit */}
        <div className="space-y-6">
          {/* Response Milestone Timeline */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Response Milestones</span>
              <span className="text-[10px] text-indigo-400 font-normal">SLA Tracker</span>
            </h3>

            <EmergencyTimeline timeline={emergency.timeline || []} />
          </div>

          {/* Forensic Audit Trail */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Immutable Audit Trail</span>
              <span className="text-[10px] text-slate-500 font-mono">Module 8</span>
            </h3>

            {auditTrail.length === 0 ? (
              <p className="text-xs text-slate-500">No external audit events logged yet.</p>
            ) : (
              <div className="divide-y divide-white/5 max-h-64 overflow-y-auto space-y-2 text-xs">
                {auditTrail.map((log, idx) => (
                  <div key={idx} className="pt-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono font-bold text-slate-300">{log.action || log.eventType}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">{log.actor || 'System'} — {log.entityId}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resolve Incident Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Resolve Emergency #{emergency.id}</h3>
            <p className="text-xs text-slate-400">
              Provide resolution notes to conclude this emergency alert and restore vehicle status to active.
            </p>

            <textarea
              rows={3}
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="e.g. Escort unit arrived, tire replaced, driver cleared to resume route."
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
              >
                {isActionLoading ? 'Saving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
