'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLiveFleet } from '../hooks/useLiveFleet';
import { DriverLocation, LocationHistoryPoint } from '@/lib/location/types';
import DriverList from '../components/map/DriverList';
import SelectedDriverPanel from '../components/map/SelectedDriverPanel';
import MapControls from '../components/map/MapControls';

// Dynamically import MapView with SSR disabled for Leaflet window safety
const MapView = dynamic(() => import('../components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl border border-white/10 text-slate-400 space-y-3">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs tracking-wider uppercase font-mono">Initializing Leaflet Geographic Engine...</p>
    </div>
  ),
});

export default function OperationsMapPage() {
  const { drivers, stats, isStreaming } = useLiveFleet({
    useSSE: true,
    pollingIntervalMs: 6000,
  });

  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [routeHistory, setRouteHistory] = useState<LocationHistoryPoint[]>([]);
  const [showRouteHistory, setShowRouteHistory] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // If there's an emergency driver on load, or if URL has ?driver=..., select it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDriverId = urlParams.get('driver');
      if (urlDriverId && drivers.length > 0) {
        const found = drivers.find((d: DriverLocation) => d.driverId === urlDriverId || d.vehicleId === urlDriverId);
        if (found) {
          setSelectedDriver(found);
          return;
        }
      }
    }

    // Default select emergency driver if exists and none selected yet
    if (!selectedDriver && drivers.length > 0) {
      const emergencyDriver = drivers.find((d: DriverLocation) => d.status === 'EMERGENCY');
      if (emergencyDriver) {
        setSelectedDriver(emergencyDriver);
      }
    }
  }, [drivers, selectedDriver]);

  // Handle Driver Selection
  const handleSelectDriver = (driver: DriverLocation) => {
    setSelectedDriver(driver);
    setShowRouteHistory(false);
    setRouteHistory([]);
  };

  // Fetch Route History for Selected Driver
  const toggleRouteHistory = async () => {
    if (!selectedDriver) return;
    if (showRouteHistory) {
      setShowRouteHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/location/history?driverId=${encodeURIComponent(selectedDriver.driverId)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setRouteHistory(data.history || []);
        setShowRouteHistory(true);
      }
    } catch (err) {
      console.error('Failed to load route history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Focus Emergency Driver
  const handleFocusEmergency = () => {
    const emergencyDriver = drivers.find((d: DriverLocation) => d.status === 'EMERGENCY');
    if (emergencyDriver) {
      setSelectedDriver(emergencyDriver);
    }
  };

  const hasEmergencies = (stats?.emergency ?? 0) > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-[#080c18] text-slate-100 overflow-hidden p-3 sm:p-4 lg:p-6 space-y-3">
      {/* Top Operations Telemetry Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition"
            title="Toggle Fleet List Panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Operations Radar
              </span>
              <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                {isStreaming ? 'SSE Real-Time Stream' : 'Live Polling'}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-white">
              Fleet Geographic Command Center
            </h1>
          </div>
        </div>

        {/* Quick KPI stats in header */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-slate-400">Total Fleet:</span>
            <span className="font-bold text-white">{stats?.total ?? drivers.length}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">Moving:</span>
            <span className="font-bold text-emerald-400">{stats?.active ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-slate-400">Delayed:</span>
            <span className="font-bold text-amber-400">{stats?.delayed ?? 0}</span>
          </div>
          {(stats?.emergency ?? 0) > 0 && (
            <Link
              href="/safety"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 animate-pulse hover:bg-rose-900/60 transition"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="font-bold">SOS ACTIVE: {stats?.emergency}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Map Workspace Layout */}
      <div className="relative flex-1 flex gap-3 min-h-[580px] h-[calc(100vh-8.5rem)] overflow-hidden">
        {/* Left Sidebar: Fleet List (collapsible) */}
        {isSidebarOpen && (
          <div className="w-72 sm:w-80 h-full shrink-0 z-10 transition-all">
            <DriverList
              drivers={drivers}
              selectedDriverId={selectedDriver?.driverId}
              onSelectDriver={handleSelectDriver}
              className="h-full"
            />
          </div>
        )}

        {/* Central Map Canvas */}
        <div className="relative flex-1 h-full min-h-[580px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#080c18]">
          <MapView
            drivers={drivers}
            selectedDriverId={selectedDriver?.driverId}
            onSelectDriver={handleSelectDriver}
            routeHistory={showRouteHistory ? routeHistory : []}
            theme={mapTheme}
            className="w-full h-full min-h-[580px]"
          />

          {/* Floating Controls Overlay */}
          <div className="absolute top-3 left-3 z-[1000]">
            <MapControls
              onCenterFleet={() => setSelectedDriver(null)}
              onFocusEmergency={handleFocusEmergency}
              hasEmergencies={hasEmergencies}
              theme={mapTheme}
              onToggleTheme={() => setMapTheme(mapTheme === 'dark' ? 'light' : 'dark')}
            />
          </div>

          {/* Emergency Alert Pill if active emergency exists */}
          {hasEmergencies && (
            <div className="absolute bottom-4 left-4 z-[1000]">
              <button
                onClick={handleFocusEmergency}
                className="px-3 py-2 rounded-xl bg-rose-950/90 border border-rose-500/60 backdrop-blur-md shadow-2xl flex items-center gap-2.5 text-xs text-rose-200 hover:bg-rose-900 transition animate-bounce"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="font-bold">Emergency Signal Active</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-800 text-[10px] font-mono">Jump</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: Selected Driver Telemetry (shown when driver is selected) */}
        {selectedDriver && (
          <div className="w-80 lg:w-88 h-full shrink-0 z-10 transition-all">
            <SelectedDriverPanel
              driver={selectedDriver}
              onClose={() => setSelectedDriver(null)}
              showRouteHistory={showRouteHistory}
              onToggleRouteHistory={toggleRouteHistory}
              isLoadingHistory={isLoadingHistory}
            />
          </div>
        )}
      </div>
    </div>
  );
}
