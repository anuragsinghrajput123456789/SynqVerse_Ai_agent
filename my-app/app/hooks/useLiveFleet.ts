'use client';

import { useState, useEffect, useCallback } from 'react';
import { DriverLocation, DriverStatus, FleetSummaryStats } from '@/lib/location/types';

interface UseLiveFleetOptions {
  useSSE?: boolean;
  pollingIntervalMs?: number;
  filter?: DriverStatus | 'ALL';
}

interface RawDriverData extends Partial<DriverLocation> {
  speedKmH?: number;
  accuracyMeters?: number;
  originHub?: string;
  destination?: string;
  lastUpdated?: string;
}

export function useLiveFleet(options?: UseLiveFleetOptions) {
  const [fleet, setFleet] = useState<DriverLocation[]>([]);
  const [rawStats, setRawStats] = useState<FleetSummaryStats | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>('DRV-014');
  const [filter, setFilter] = useState<DriverStatus | 'ALL'>(options?.filter || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const pollingInterval = options?.pollingIntervalMs ?? 6000;
  const enableSSE = options?.useSSE ?? true;

  const fetchFleet = useCallback(async () => {
    try {
      const res = await fetch('/api/location/live');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Normalize driver location fields
          const normalized: DriverLocation[] = (data.fleet || []).map((d: RawDriverData) => ({
            driverId: d.driverId || 'DRV-UNKNOWN',
            driverName: d.driverName || 'Unknown Driver',
            vehicleId: d.vehicleId || d.vehicleRegistration || 'VEH-UNKNOWN',
            vehicleRegistration: d.vehicleRegistration || d.vehicleId || 'VEH-UNKNOWN',
            latitude: d.latitude ?? 0,
            longitude: d.longitude ?? 0,
            speed: d.speed ?? d.speedKmH ?? 0,
            heading: d.heading ?? 0,
            accuracy: d.accuracy ?? d.accuracyMeters ?? 10,
            status: d.status ?? 'ONLINE',
            corridor: d.corridor || `${d.originHub || 'Hub'} ↔ ${d.destination || 'Destination'}`,
            timestamp: d.timestamp || d.lastUpdated || new Date().toISOString(),
          }));

          setFleet(normalized);
          setRawStats(data.stats);
          setError(null);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to live fleet stream.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFleet();

    let eventSource: EventSource | null = null;
    if (enableSSE) {
      try {
        eventSource = new EventSource('/api/location/stream');
        eventSource.onopen = () => {
          setIsStreaming(true);
        };
        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'location_update' && payload.location) {
              setFleet((prev) => {
                const updated = payload.location as DriverLocation;
                const normalizedUpdated = {
                  ...updated,
                  vehicleId: updated.vehicleId || updated.vehicleRegistration,
                  speed: updated.speed ?? updated.speedKmH ?? 0,
                  accuracy: updated.accuracy ?? updated.accuracyMeters ?? 10,
                  corridor: updated.corridor || `${updated.originHub || 'Hub'} ↔ ${updated.destination || 'Destination'}`,
                  timestamp: updated.timestamp || updated.lastUpdated || new Date().toISOString(),
                };
                const idx = prev.findIndex((d) => d.driverId === normalizedUpdated.driverId);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = normalizedUpdated;
                  return next;
                }
                return [normalizedUpdated, ...prev];
              });
            }
          } catch {
            // non-blocking
          }
        };
        eventSource.onerror = () => {
          setIsStreaming(false);
        };
      } catch {
        setIsStreaming(false);
      }
    }

    const interval = setInterval(fetchFleet, pollingInterval);

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchFleet, enableSSE, pollingInterval]);

  const selectedDriver = fleet.find((d) => d.driverId === selectedDriverId) || null;

  const filteredFleet = fleet.filter((d) => {
    const matchesFilter = filter === 'ALL' || d.status === filter;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      d.driverName.toLowerCase().includes(query) ||
      d.driverId.toLowerCase().includes(query) ||
      (d.vehicleRegistration || '').toLowerCase().includes(query) ||
      (d.vehicleId || '').toLowerCase().includes(query) ||
      (d.originHub || '').toLowerCase().includes(query) ||
      (d.destination || '').toLowerCase().includes(query);

    return matchesFilter && matchesQuery;
  });

  const activeCount = fleet.filter((d) => d.status === 'ONLINE' || d.status === 'ACTIVE').length;
  const delayedCount = fleet.filter((d) => d.status === 'DELAYED').length;
  const emergencyCount = fleet.filter((d) => d.status === 'EMERGENCY').length;
  const offlineCount = fleet.filter((d) => d.status === 'OFFLINE').length;

  const speeds = fleet.map((d) => d.speed).filter((s): s is number => typeof s === 'number' && s > 0);
  const calculatedAvgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0;

  const stats: FleetSummaryStats = {
    totalDrivers: rawStats?.totalDrivers ?? fleet.length,
    onlineDrivers: rawStats?.onlineDrivers ?? activeCount,
    offlineDrivers: rawStats?.offlineDrivers ?? offlineCount,
    delayedDrivers: rawStats?.delayedDrivers ?? delayedCount,
    emergencyAlerts: rawStats?.emergencyAlerts ?? emergencyCount,
    activeTrips: rawStats?.activeTrips ?? activeCount,
    locationUpdatesToday: rawStats?.locationUpdatesToday ?? (fleet.length > 0 ? fleet.length * 12 : 0),
    // Unified aliases
    total: rawStats?.totalDrivers ?? fleet.length,
    active: rawStats?.onlineDrivers ?? activeCount,
    delayed: rawStats?.delayedDrivers ?? delayedCount,
    emergency: rawStats?.emergencyAlerts ?? emergencyCount,
    avgSpeedKmh: rawStats?.avgSpeedKmh ?? calculatedAvgSpeed,
  };

  return {
    fleet: filteredFleet,
    drivers: filteredFleet,
    allFleet: fleet,
    stats,
    selectedDriver,
    selectedDriverId,
    setSelectedDriverId,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    loading,
    isLoading: loading,
    isStreaming,
    error,
    refresh: fetchFleet,
  };
}
