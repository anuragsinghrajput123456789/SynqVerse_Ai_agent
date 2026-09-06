import { LocationRepository } from './repository';
import { DriverLocation, LocationHistoryPoint, LocationIngestInput, FleetSummaryStats } from './types';
import { DriverRepository, VehicleRepository } from '../repositories';

export * from './types';
export * from './repository';

type LocationListener = (loc: DriverLocation) => void;
const listeners = new Set<LocationListener>();

export class LocationService {
  private static instance: LocationService;
  private repo = new LocationRepository();
  private driverRepo = new DriverRepository();
  private vehicleRepo = new VehicleRepository();

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public subscribe(listener: LocationListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  public async ingestLocation(input: LocationIngestInput): Promise<DriverLocation> {
    const existing = await this.repo.findByDriverId(input.driverId);

    // Resolve driver name if not already cached
    let driverName = existing?.driverName || 'Driver ' + input.driverId.replace('DRV-', '');
    if (!existing) {
      const d = await this.driverRepo.findById(input.driverId);
      if (d) driverName = d.name;
    }

    // Resolve vehicle
    let reg = input.vehicleRegistration || existing?.vehicleRegistration || 'UP17GN7381';
    let model = existing?.vehicleModel || 'Tata LPT 3118';
    if (!existing && input.vehicleRegistration) {
      const v = await this.vehicleRepo.findByReg(input.vehicleRegistration);
      if (v) {
        reg = v.registrationNumber;
        model = v.model;
      }
    }

    const now = input.timestamp || new Date().toISOString();
    const history = existing?.history ? [...existing.history] : [];

    // Rate-limit history appends: only append if last point was >= 30 seconds ago
    const lastPoint = history[history.length - 1];
    const shouldAppendHistory =
      !lastPoint ||
      Math.abs(new Date(now).getTime() - new Date(lastPoint.timestamp).getTime()) >= 30000;

    if (shouldAppendHistory) {
      history.push({
        latitude: input.latitude,
        longitude: input.longitude,
        timestamp: now,
        speedKmH: input.speedKmH ?? 45,
      });
      // Cap history to 50 points in memory
      if (history.length > 50) history.shift();
    }

    const updated: DriverLocation = {
      driverId: input.driverId,
      driverName,
      vehicleRegistration: reg,
      vehicleModel: model,
      latitude: input.latitude,
      longitude: input.longitude,
      speedKmH: input.speedKmH ?? (existing?.speedKmH ?? 45),
      heading: input.heading ?? (existing?.heading ?? 0),
      accuracyMeters: input.accuracyMeters ?? 10,
      status: existing?.status === 'EMERGENCY' ? 'EMERGENCY' : 'ONLINE',
      originHub: existing?.originHub || 'Delhi',
      destination: existing?.destination || 'Jaipur',
      currentTripId: existing?.currentTripId,
      clientName: existing?.clientName,
      lastUpdated: now,
      isLive: true,
      emergencyId: existing?.emergencyId,
      history,
    };

    await this.repo.upsertLocation(updated);

    // Broadcast to SSE listeners
    listeners.forEach((fn) => {
      try {
        fn(updated);
      } catch {
        // Ignore dead listener
      }
    });

    return updated;
  }

  public async setDriverEmergency(driverId: string, emergencyId: string): Promise<void> {
    const loc = await this.repo.findByDriverId(driverId);
    if (loc) {
      loc.status = 'EMERGENCY';
      loc.emergencyId = emergencyId;
      loc.lastUpdated = new Date().toISOString();
      await this.repo.upsertLocation(loc);
      listeners.forEach((fn) => fn(loc));
    }
  }

  public async clearDriverEmergency(driverId: string): Promise<void> {
    const loc = await this.repo.findByDriverId(driverId);
    if (loc) {
      loc.status = 'ONLINE';
      loc.emergencyId = null;
      loc.lastUpdated = new Date().toISOString();
      await this.repo.upsertLocation(loc);
      listeners.forEach((fn) => fn(loc));
    }
  }

  public async getLiveFleet(): Promise<DriverLocation[]> {
    return this.repo.findAll();
  }

  public async getDriverLocation(driverId: string): Promise<DriverLocation | null> {
    return this.repo.findByDriverId(driverId);
  }

  public async getDriverHistory(driverId: string, range: string = 'today'): Promise<LocationHistoryPoint[]> {
    const loc = await this.repo.findByDriverId(driverId);
    if (!loc || !loc.history) return [];

    const now = Date.now();
    let maxAgeMs = 24 * 3600000;
    if (range === '15m') maxAgeMs = 15 * 60000;
    else if (range === '1h') maxAgeMs = 60 * 60000;

    return loc.history.filter((pt) => now - new Date(pt.timestamp).getTime() <= maxAgeMs);
  }

  public async getFleetStats(): Promise<FleetSummaryStats> {
    return this.repo.getFleetStats();
  }
}
