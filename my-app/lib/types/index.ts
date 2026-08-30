export type EntityStatus = 'RESOLVED' | 'AMBIGUOUS' | 'UNRESOLVED';
export type MatchingMethod = 'CANONICAL_ID' | 'EXACT_PLATE' | 'EXACT_ALIAS' | 'EXACT_ROSTER_ID' | 'CLIENT_NAME_MATCH';

export interface Vehicle {
  registrationNumber: string;
  vehicleId?: string;
  model: string;
  year: number;
  bsStage: string;
  engineHeater: boolean;
  homeHub: string;
  capacityTonnes: number;
  status: string;
  aliases: string[];
}

export interface Driver {
  driverId: string;
  name: string;
  phone: string;
  dlNumber: string;
  aadhaar: string;
  joiningDate: string;
  homeHub: string;
}

export interface Client {
  clientId: string;
  name: string;
  contractSlaHours: number;
  operationalSlaHours: number;
  specialRules: string[];
}

export interface BreakdownTicket {
  ticketId: string;
  createdAt: string;
  vehicle: string;
  driverId: string;
  originHub: string;
  kmFromOriginHub: number;
  destination: string;
  issue: string;
  severity: string;
  client: string;
  status: string;
  resolutionNote?: string;
}

export interface SourceCitation {
  sourceId: string;
  sourceFile: string;
  sourceType: 'fleet_master' | 'drivers_roster' | 'maintenance_log' | 'tickets' | 'meridian_trips' | 'email_thread' | 'dispatcher_interview';
  recordId: string;
  field: string;
  originalValueMasked: unknown;
  resolvedValue: unknown;
  precedence: number;
  resolutionReason: string;
  timestamp?: string;
}

export interface Conflict {
  id: string;
  entityType: 'vehicle' | 'driver' | 'client' | 'maintenance' | 'ticket';
  entityId: string;
  field: string;
  winningValue: unknown;
  winningSource: string;
  rejectedValue: unknown;
  rejectedSource: string;
  reason: string;
  timestamp?: string;
  ingestionRunId: string;
}

export interface ResolvedEntity {
  canonicalId: string;
  type: 'vehicle' | 'driver' | 'client';
  canonicalData: Record<string, unknown>;
  originalValue: string;
  source: string;
  matchingMethod: MatchingMethod;
  confidence: number;
  status: EntityStatus;
  aliases: string[];
  citations: SourceCitation[];
  conflicts: Conflict[];
  ingestionRunId: string;
}

export interface QuarantineRecord {
  id: string;
  source: string;
  recordIdentifier: string;
  reason: string;
  validationErrors: string[];
  ingestionRunId: string;
  timestamp: string;
  status: 'QUARANTINED';
  rawRecordMasked: Record<string, unknown>;
}

export interface QueryResult {
  answer: string;
  status: 'grounded' | 'insufficient_data';
  sources: SourceCitation[];
  conflicts: Conflict[];
}

export interface IngestionStatus {
  ingestionRunId: string;
  filesDiscovered: string[];
  recordsIngested: {
    fleetMaster: number;
    drivers: number;
    trips: number;
    maintenance: number;
    tickets: number;
    emails: number;
    transcripts: number;
  };
  recordsNormalized: number;
  entitiesResolved: {
    vehicles: number;
    drivers: number;
    clients: number;
  };
  conflictsDetected: number;
  piiFieldsMasked: number;
  recordsRejected: number;
  quarantinedRecords: QuarantineRecord[];
  timestamp: string;
}

export type QueueTicketStatus = 'READY' | 'PROCESSING' | 'COMPLETED' | 'DUPLICATE' | 'QUARANTINED';

export interface QueueTicket {
  ticketId: string;
  idempotencyKey: string; // BREAKDOWN:{canonicalTicketId}
  canonicalTicketId: string;
  createdAt: string;
  vehicle: string;
  rawVehicle: string;
  driverId: string;
  rawDriverId: string;
  originHub: string;
  kmFromOriginHub: number;
  destination: string;
  issue: string;
  severity: string;
  client: string;
  status: QueueTicketStatus;
  originalStatus?: string;
  resolutionNote?: string;
  isDuplicate: boolean;
  duplicateOf?: string;
  isQuarantined: boolean;
  quarantineReason?: string;
  validationErrors?: string[];
  ingestionRunId: string;
  sourceFile: string;
  processedAt?: string;
}

export interface QueueStats {
  total: number;
  valid: number;
  duplicates: number;
  quarantined: number;
  ready: number;
  processing: number;
  completed: number;
}
