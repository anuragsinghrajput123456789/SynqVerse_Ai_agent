export type DriverStatus = 'ONLINE' | 'ACTIVE' | 'DELAYED' | 'EMERGENCY' | 'OFFLINE';

export interface LocationHistoryPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speedKmH: number;
  label?: string;
}

export interface DriverLocation {
  driverId: string;
  driverName: string;
  vehicleRegistration: string;
  vehicleId?: string;
  vehicleModel?: string;
  latitude: number;
  longitude: number;
  speedKmH?: number;
  speed?: number;
  heading?: number;
  accuracyMeters?: number;
  accuracy?: number;
  batteryLevel?: number;
  phone?: string;
  corridor?: string;
  timestamp?: string;
  status: DriverStatus;
  originHub?: string;
  destination?: string;
  currentTripId?: string;
  clientName?: string;
  lastUpdated?: string;
  isLive?: boolean;
  freshness?: LocationFreshness;
  emergencyId?: string | null;
  history?: LocationHistoryPoint[];
}

export type LocationFreshness = 'LIVE' | 'STALE' | 'OFFLINE';

/**
 * Computes telemetry freshness state based on last update timestamp:
 * - < 2 minutes: LIVE
 * - 2 to 10 minutes: STALE
 * - > 10 minutes: OFFLINE
 */
export function calculateFreshness(lastUpdated?: string | Date | number | null): LocationFreshness {
  if (!lastUpdated) return 'OFFLINE';
  const timeMs =
    typeof lastUpdated === 'number'
      ? lastUpdated
      : typeof lastUpdated === 'string'
      ? new Date(lastUpdated).getTime()
      : lastUpdated.getTime();

  if (isNaN(timeMs)) return 'OFFLINE';

  const elapsedMs = Math.abs(Date.now() - timeMs);
  const twoMinutesMs = 2 * 60 * 1000;
  const tenMinutesMs = 10 * 60 * 1000;

  if (elapsedMs < twoMinutesMs) {
    return 'LIVE';
  }
  if (elapsedMs <= tenMinutesMs) {
    return 'STALE';
  }
  return 'OFFLINE';
}

export interface LocationIngestInput {
  driverId: string;
  vehicleRegistration?: string;
  latitude: number;
  longitude: number;
  speedKmH?: number;
  heading?: number;
  accuracyMeters?: number;
  timestamp?: string;
}

export interface FleetSummaryStats {
  totalDrivers: number;
  onlineDrivers: number;
  offlineDrivers: number;
  delayedDrivers: number;
  emergencyAlerts: number;
  activeTrips: number;
  locationUpdatesToday: number;
  // Normalized UI aliases
  total?: number;
  active?: number;
  delayed?: number;
  emergency?: number;
  avgSpeedKmh?: number;
}
