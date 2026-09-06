export interface VehicleContextItem {
  id: string;
  vehicleId: string;
  rawPlate: string;
  registrationNumber: string;
  model: string;
  status: string;
  location: string;
  totalTrips: number;
  openTickets: number;
  lastMaintenance: string;
  source: string;
  authority: string;
  timestamp: string;
  specifications: {
    make: string;
    capacity: string;
    emission: string;
    engineHeater: boolean;
    speedGovernor: string;
  };
}

export const vehiclesData: VehicleContextItem[] = [
  {
    id: 'TRK-104',
    vehicleId: 'TRK-104',
    rawPlate: 'up 60 bk 0144',
    registrationNumber: 'UP-60-BK-0144',
    model: 'BharatBenz 2823C Heavy Hauler',
    status: 'ACTIVE',
    location: 'Delhi',
    totalTrips: 28,
    openTickets: 2,
    lastMaintenance: '12 Aug 2025',
    source: 'fleet_master.csv',
    authority: 'Authoritative',
    timestamp: '2025-08-12T04:20:00Z',
    specifications: {
      make: 'BharatBenz 2823C',
      capacity: '28 Ton Heavy Duty',
      emission: 'BS6 Compliant',
      engineHeater: true,
      speedGovernor: 'Calibrated at 80 km/h',
    },
  },
  {
    id: 'TRK-121',
    vehicleId: 'TRK-121',
    rawPlate: 'mh-04ax9912',
    registrationNumber: 'MH-04-AX-9912',
    model: 'Tata Signa 4825.TK',
    status: 'MAINTENANCE',
    location: 'Mumbai',
    totalTrips: 34,
    openTickets: 1,
    lastMaintenance: '02 Sep 2025',
    source: 'fleet_master.csv',
    authority: 'Authoritative',
    timestamp: '2025-09-02T10:15:00Z',
    specifications: {
      make: 'Tata Signa 4825.TK',
      capacity: '40 Ton Tipper',
      emission: 'BS6 Compliant',
      engineHeater: false,
      speedGovernor: 'Calibrated at 80 km/h',
    },
  },
  {
    id: 'TRK-221',
    vehicleId: 'TRK-221',
    rawPlate: 'KA 01 MJ 5519',
    registrationNumber: 'KA-01-MJ-5519',
    model: 'Ashok Leyland 4220 HG',
    status: 'ACTIVE',
    location: 'Bangalore',
    totalTrips: 19,
    openTickets: 0,
    lastMaintenance: '18 Jul 2025',
    source: 'fleet_master.csv',
    authority: 'Authoritative',
    timestamp: '2025-07-18T14:30:00Z',
    specifications: {
      make: 'Ashok Leyland 4220 HG',
      capacity: '35 Ton Multi-Axle',
      emission: 'BS6 Compliant',
      engineHeater: false,
      speedGovernor: 'Calibrated at 80 km/h',
    },
  },
  {
    id: 'TRK-308',
    vehicleId: 'TRK-308',
    rawPlate: 'TN09CB4011',
    registrationNumber: 'TN-09-CB-4011',
    model: 'Eicher Pro 6028T',
    status: 'ASSIGNED',
    location: 'Chennai',
    totalTrips: 42,
    openTickets: 1,
    lastMaintenance: '25 Aug 2025',
    source: 'telemetry_stream.json',
    authority: 'Secondary',
    timestamp: '2025-08-25T08:00:00Z',
    specifications: {
      make: 'Eicher Pro 6028T',
      capacity: '28 Ton Multi-Axle',
      emission: 'BS6 Compliant',
      engineHeater: true,
      speedGovernor: 'Calibrated at 80 km/h',
    },
  },
];

export interface DriverContextItem {
  id: string;
  name: string;
  phone: string;
  license: string;
  status: string;
  assignedVehicle: string;
  source: string;
  authority: string;
}

export const driversData: DriverContextItem[] = [
  { id: 'DRV-8821', name: 'Ramesh Kumar', phone: 'XXXXX-8219 (Masked)', license: 'DL-04-XXXX-9912', status: 'ON_DUTY', assignedVehicle: 'TRK-104', source: 'driver_roster.xlsx', authority: 'Authoritative' },
  { id: 'DRV-4412', name: 'Suresh Patel', phone: 'XXXXX-1120 (Masked)', license: 'GJ-06-XXXX-4421', status: 'ON_DUTY', assignedVehicle: 'TRK-221', source: 'driver_roster.xlsx', authority: 'Authoritative' },
  { id: 'DRV-1930', name: 'Vikram Singh', phone: 'XXXXX-3304 (Masked)', license: 'RJ-14-XXXX-8829', status: 'STANDBY', assignedVehicle: 'TRK-308', source: 'driver_roster.xlsx', authority: 'Authoritative' },
  { id: 'DRV-5529', name: 'Anil Verma', phone: 'XXXXX-9014 (Masked)', license: 'JH-01-XXXX-5529', status: 'ON_DUTY', assignedVehicle: 'TRK-118', source: 'driver_roster.xlsx', authority: 'Authoritative' },
];

export interface ClientContextItem {
  id: string;
  name: string;
  priority: string;
  slaTurnaroundMin: number;
  bs6Mandatory: boolean;
  contractId: string;
  source: string;
  authority: string;
}

export const clientsData: ClientContextItem[] = [
  { id: 'CLI-001', name: 'Shakti Cement', priority: 'TIER-1', slaTurnaroundMin: 45, bs6Mandatory: true, contractId: 'CON-2025-SC', source: 'contracts_master.csv', authority: 'Authoritative' },
  { id: 'CLI-002', name: 'Reliance Industries', priority: 'TIER-1', slaTurnaroundMin: 30, bs6Mandatory: true, contractId: 'CON-2025-RIL', source: 'contracts_master.csv', authority: 'Authoritative' },
  { id: 'CLI-003', name: 'Adani Logistics', priority: 'TIER-1', slaTurnaroundMin: 60, bs6Mandatory: false, contractId: 'CON-2025-AD', source: 'contracts_master.csv', authority: 'Authoritative' },
  { id: 'CLI-004', name: 'Tata Steel', priority: 'TIER-2', slaTurnaroundMin: 45, bs6Mandatory: true, contractId: 'CON-2025-TS', source: 'contracts_master.csv', authority: 'Authoritative' },
];

export interface TripContextItem {
  id: string;
  vehicle: string;
  origin: string;
  destination: string;
  client: string;
  status: string;
  kmCompleted: number;
}

export const tripsData: TripContextItem[] = [
  { id: 'TRP-8812', vehicle: 'TRK-104', origin: 'Mumbai Central', destination: 'Delhi Industrial Corridor', client: 'Shakti Cement', status: 'HALTED_BREAKDOWN', kmCompleted: 420 },
  { id: 'TRP-8811', vehicle: 'TRK-221', origin: 'Jamnagar Hub', destination: 'Dahej Petrochemical', client: 'Reliance', status: 'IN_TRANSIT', kmCompleted: 180 },
  { id: 'TRP-8810', vehicle: 'TRK-308', origin: 'Mundra Port', destination: 'Ahmedabad Logistics Park', client: 'Adani', status: 'SCHEDULED', kmCompleted: 0 },
];

export interface MaintenanceContextItem {
  id: string;
  vehicle: string;
  component: string;
  odometerKm: number;
  date: string;
  mechanic: string;
  status: string;
  ruleCitation: string;
}

export const maintenanceData: MaintenanceContextItem[] = [
  { id: 'MNT-4410', vehicle: 'TRK-104', component: 'Brake Disc Calipers', odometerKm: 142500, date: '2025-08-12', mechanic: 'Gopal Auto Works', status: 'OVERDUE_REPLACEMENT', ruleCitation: 'Fleet Safety Policy §4.2' },
  { id: 'MNT-4409', vehicle: 'TRK-121', component: 'Transmission Fluid', odometerKm: 98200, date: '2025-09-02', mechanic: 'Tata Authorized Service', status: 'COMPLETED', ruleCitation: 'Scheduled Interval' },
  { id: 'MNT-4408', vehicle: 'TRK-221', component: 'Radiator Flush', odometerKm: 110400, date: '2025-07-18', mechanic: 'Apex Fleet Care', status: 'COMPLETED', ruleCitation: 'Scheduled Interval' },
];

export interface ConflictContextItem {
  id: string;
  entity: string;
  primaryValue: string;
  secondaryValue: string;
  resolution: string;
  authority: string;
  status: string;
}

export const conflictsData: ConflictContextItem[] = [
  {
    id: 'CONF-01',
    entity: 'Vehicle TRK-104 Odometer',
    primaryValue: '142,500 km (fleet_master.csv)',
    secondaryValue: '144,120 km (driver_trip_sheet.xlsx)',
    resolution: 'RESOLVED to 144,120 km based on newer timestamp (2025-09-04 18:00)',
    authority: 'Authoritative Override',
    status: 'RESOLVED',
  },
  {
    id: 'CONF-02',
    entity: 'Driver DRV-8821 Assigned Hub',
    primaryValue: 'Mumbai Hub (driver_roster.xlsx)',
    secondaryValue: 'Delhi Depot (live_gps_telemetry)',
    resolution: 'RESOLVED to Delhi Depot (Active corridor waypoint override)',
    authority: 'Telemetry Live',
    status: 'RESOLVED',
  },
];

export interface SourceContextItem {
  name: string;
  records: number;
  authority: string;
  lastIngested: string;
  status: string;
}

export const sourcesData: SourceContextItem[] = [
  { name: 'fleet_master.csv', records: 48, authority: 'Authoritative', lastIngested: '10 mins ago', status: 'HEALTHY' },
  { name: 'contracts_master.csv', records: 12, authority: 'Authoritative', lastIngested: '10 mins ago', status: 'HEALTHY' },
  { name: 'driver_roster.xlsx', records: 64, authority: 'Authoritative', lastIngested: '10 mins ago', status: 'HEALTHY' },
  { name: 'maintenance_logs.csv', records: 120, authority: 'Authoritative', lastIngested: '10 mins ago', status: 'HEALTHY' },
  { name: 'dispatcher_interview.txt', records: 13, authority: 'Authoritative (Rules)', lastIngested: '10 mins ago', status: 'HEALTHY' },
  { name: 'telemetry_stream.json', records: 1420, authority: 'Secondary (Live)', lastIngested: 'Real-time', status: 'LIVE_STREAMING' },
];
