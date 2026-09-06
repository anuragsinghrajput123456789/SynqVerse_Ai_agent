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
  emergencyId?: string | null;
  history?: LocationHistoryPoint[];
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
