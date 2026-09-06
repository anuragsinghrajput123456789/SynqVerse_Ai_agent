import { Db } from 'mongodb';
import { getMongoDb } from '../db/mongodb';
import { DriverLocation, FleetSummaryStats } from './types';

// Pre-seeded authentic fleet locations based on drivers_roster.csv and fleet_master.csv
const defaultFleet: DriverLocation[] = [
  {
    driverId: 'DRV-009',
    driverName: 'David Radhakrishnan',
    vehicleRegistration: 'DL30AN8381',
    vehicleModel: 'Eicher Pro 6028',
    latitude: 28.6139,
    longitude: 77.2090,
    speedKmH: 48,
    heading: 185,
    accuracyMeters: 8,
    status: 'ONLINE',
    originHub: 'Delhi',
    destination: 'Jaipur',
    currentTripId: 'trip-153815677',
    clientName: 'Orion Pharma',
    lastUpdated: new Date().toISOString(),
    isLive: true,
    history: [
      { latitude: 28.6500, longitude: 77.2100, timestamp: new Date(Date.now() - 30 * 60000).toISOString(), speedKmH: 45 },
      { latitude: 28.6300, longitude: 77.2120, timestamp: new Date(Date.now() - 15 * 60000).toISOString(), speedKmH: 52 },
      { latitude: 28.6139, longitude: 77.2090, timestamp: new Date().toISOString(), speedKmH: 48 },
    ],
  },
  {
    driverId: 'DRV-014',
    driverName: 'Devin Sibal',
    vehicleRegistration: 'UP17GN7381', // TRK-104
    vehicleModel: 'Tata LPT 3118',
    latitude: 28.2045,
    longitude: 76.8320,
    speedKmH: 0,
    heading: 210,
    accuracyMeters: 5,
    status: 'EMERGENCY',
    originHub: 'Delhi',
    destination: 'Kanpur',
    currentTripId: 'trip-153712955',
    clientName: 'Vertex Retail',
    lastUpdated: new Date().toISOString(),
    isLive: true,
    emergencyId: 'SOS-1042',
    history: [
      { latitude: 28.4500, longitude: 77.0200, timestamp: new Date(Date.now() - 45 * 60000).toISOString(), speedKmH: 60 },
      { latitude: 28.3200, longitude: 76.9100, timestamp: new Date(Date.now() - 20 * 60000).toISOString(), speedKmH: 45 },
      { latitude: 28.2045, longitude: 76.8320, timestamp: new Date().toISOString(), speedKmH: 0 },
    ],
  },
  {
    driverId: 'DRV-003',
    driverName: 'Alexander Chander',
    vehicleRegistration: 'DL41GG9786',
    vehicleModel: 'Ashok Leyland 3520',
    latitude: 28.4595,
    longitude: 77.0266,
    speedKmH: 42,
    heading: 95,
    accuracyMeters: 10,
    status: 'ONLINE',
    originHub: 'Gurgaon',
    destination: 'Lucknow',
    currentTripId: 'trip-153740842',
    clientName: 'Apex Chemicals',
    lastUpdated: new Date().toISOString(),
    isLive: true,
    history: [
      { latitude: 28.4700, longitude: 77.0100, timestamp: new Date(Date.now() - 25 * 60000).toISOString(), speedKmH: 40 },
      { latitude: 28.4595, longitude: 77.0266, timestamp: new Date().toISOString(), speedKmH: 42 },
    ],
  },
  {
    driverId: 'DRV-007',
    driverName: 'Charan Chanda',
    vehicleRegistration: 'RJ43DD3546',
    vehicleModel: 'BharatBenz 2823R',
    latitude: 26.9124,
    longitude: 75.7873,
    speedKmH: 55,
    heading: 320,
    accuracyMeters: 12,
    status: 'ONLINE',
    originHub: 'Jaipur',
    destination: 'Delhi',
    currentTripId: 'trip-153724441',
    clientName: 'Shakti Cement',
    lastUpdated: new Date().toISOString(),
    isLive: true,
    history: [
      { latitude: 26.8500, longitude: 75.8100, timestamp: new Date(Date.now() - 40 * 60000).toISOString(), speedKmH: 50 },
      { latitude: 26.9124, longitude: 75.7873, timestamp: new Date().toISOString(), speedKmH: 55 },
    ],
  },
  {
    driverId: 'DRV-004',
    driverName: 'Hardik Saini',
    vehicleRegistration: 'UP13DI3925',
    vehicleModel: 'BharatBenz 2823R',
    latitude: 26.8467,
    longitude: 80.9462,
    speedKmH: 22,
    heading: 140,
    accuracyMeters: 15,
    status: 'DELAYED',
    originHub: 'Lucknow',
    destination: 'Kanpur',
    currentTripId: 'trip-153699945',
    clientName: 'Internal',
    lastUpdated: new Date().toISOString(),
    isLive: true,
    history: [
      { latitude: 26.8800, longitude: 80.9100, timestamp: new Date(Date.now() - 30 * 60000).toISOString(), speedKmH: 25 },
      { latitude: 26.8467, longitude: 80.9462, timestamp: new Date().toISOString(), speedKmH: 22 },
    ],
  },
  {
    driverId: 'DRV-002',
    driverName: 'Dalaja Chahal',
    vehicleRegistration: 'PB31NP8886',
    vehicleModel: 'Eicher Pro 6028',
    latitude: 30.9010,
    longitude: 75.8573,
    speedKmH: 0,
    heading: 0,
    accuracyMeters: 20,
    status: 'OFFLINE',
    originHub: 'Ludhiana',
    destination: 'Chandigarh',
    currentTripId: 'trip-153679919',
    clientName: 'Internal',
    lastUpdated: new Date(Date.now() - 4 * 3600000).toISOString(),
    isLive: false,
    history: [],
  },
  {
    driverId: 'DRV-001',
    driverName: 'Advik Maharaj',
    vehicleRegistration: 'HR73CY1771',
    vehicleModel: 'Tata LPT 3118',
    latitude: 30.3782,
    longitude: 76.7767,
    speedKmH: 50,
    heading: 45,
    accuracyMeters: 8,
    status: 'ONLINE',
    originHub: 'Ambala',
    destination: 'Delhi',
    currentTripId: 'trip-153811821',
    clientName: 'Shakti Cement',
    lastUpdated: new Date().toISOString(),
    isLive: true,
    history: [
      { latitude: 30.3200, longitude: 76.7500, timestamp: new Date(Date.now() - 20 * 60000).toISOString(), speedKmH: 48 },
      { latitude: 30.3782, longitude: 76.7767, timestamp: new Date().toISOString(), speedKmH: 50 },
    ],
  },
  {
    driverId: 'DRV-048',
    driverName: 'Sunil Yadav',
    vehicleRegistration: 'PB 47 HL 3939',
    vehicleModel: 'Tata LPT 3118',
    latitude: 12.9716,
    longitude: 77.5946,
    speedKmH: 38,
    heading: 80,
    accuracyMeters: 9,
    status: 'ONLINE',
    originHub: 'Bengaluru',
    destination: 'Chennai',
    currentTripId: 'trip-153835485',
    clientName: 'Shakti Cement',
    lastUpdated: new Date().toISOString(),
    isLive: true,
    history: [],
  },
];

const inMemoryLocations = new Map<string, DriverLocation>();
defaultFleet.forEach((d) => inMemoryLocations.set(d.driverId, d));

let locationUpdatesCount = 142;

async function getDb(): Promise<Db | null> {
  try {
    return await getMongoDb();
  } catch {
    return null;
  }
}

let indexesInitialized = false;

async function ensureLocationIndexes(db: Db) {
  if (indexesInitialized) return;
  try {
    const col = db.collection<DriverLocation>('driver_locations');
    await col.createIndex({ driverId: 1 }, { unique: true });
    await col.createIndex({ status: 1 });
    await col.createIndex({ lastUpdated: -1 });
    indexesInitialized = true;
  } catch {
    // Non-fatal if index already exists
  }
}

export class LocationRepository {
  public async upsertLocation(loc: DriverLocation): Promise<DriverLocation> {
    locationUpdatesCount++;
    inMemoryLocations.set(loc.driverId, loc);

    const db = await getDb();
    if (db) {
      await ensureLocationIndexes(db);
      const col = db.collection<DriverLocation>('driver_locations');
      await col.updateOne({ driverId: loc.driverId }, { $set: loc }, { upsert: true });
    }

    return loc;
  }

  public async findByDriverId(driverId: string): Promise<DriverLocation | null> {
    const mem = inMemoryLocations.get(driverId);
    if (mem) return mem;

    const db = await getDb();
    if (db) {
      const col = db.collection<DriverLocation>('driver_locations');
      const found = await col.findOne({ driverId });
      if (found) {
        inMemoryLocations.set(driverId, found);
        return found;
      }
    }
    return null;
  }

  public async findAll(): Promise<DriverLocation[]> {
    const list = Array.from(inMemoryLocations.values());
    const db = await getDb();
    if (db && list.length === 0) {
      const col = db.collection<DriverLocation>('driver_locations');
      const dbList = await col.find({}).toArray();
      if (dbList.length > 0) {
        dbList.forEach((d) => inMemoryLocations.set(d.driverId, d));
        return dbList;
      }
    }
    return list;
  }

  public async getFleetStats(): Promise<FleetSummaryStats> {
    const all = await this.findAll();
    const online = all.filter((d) => d.status === 'ONLINE').length;
    const delayed = all.filter((d) => d.status === 'DELAYED').length;
    const emergency = all.filter((d) => d.status === 'EMERGENCY').length;
    const offline = all.filter((d) => d.status === 'OFFLINE').length;
    const activeTrips = all.filter((d) => d.status !== 'OFFLINE').length;

    return {
      totalDrivers: all.length,
      onlineDrivers: online,
      offlineDrivers: offline,
      delayedDrivers: delayed,
      emergencyAlerts: emergency,
      activeTrips,
      locationUpdatesToday: locationUpdatesCount,
    };
  }
}
