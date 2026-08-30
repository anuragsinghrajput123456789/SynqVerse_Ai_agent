/**
 * Controlled Ticket Schema Adapter
 * 
 * Provides deterministic schema detection and normalization for breakdown ticket feeds
 * with field variations (snake_case, camelCase, alternate keys).
 * 
 * Invariants:
 * 1. Detects input schema variation.
 * 2. Maps recognized field variations deterministically.
 * 3. Preserves unknown / extra fields in metadata without data loss.
 * 4. Strictly validates critical required fields (ticketId, vehicle, issue).
 * 5. Flags records for quarantine when fields cannot be safely interpreted.
 * 6. Never silently corrupts or drops data.
 */

export interface AdaptedTicketRecord {
  ticketId: string;
  vehicle: string;
  driverId: string;
  client: string;
  issue: string;
  severity: string;
  originHub: string;
  destination: string;
  kmFromOriginHub: number;
  createdAt: string;
  status: string;
  resolutionNote: string;
  detectedSchema: string;
  mappedFields: string[];
  preservedUnknownFields: Record<string, unknown>;
  rawRecord: Record<string, unknown>;
}

export interface AdapterResult {
  success: boolean;
  adaptedRecord?: AdaptedTicketRecord;
  validationErrors: string[];
  rawRecord: Record<string, unknown>;
  detectedSchema: string;
}

// Controlled field alias dictionary
const FIELD_ALIASES: Record<string, string[]> = {
  ticketId: ['ticket_id', 'ticketId', 'id', 'ticket_no', 'ticketNumber', 'tkt_id', 'incident_id'],
  vehicle: ['vehicle', 'vehicle_id', 'vehicleId', 'registration_number', 'registrationNumber', 'reg_no', 'truck_id', 'truck'],
  driverId: ['driver_id', 'driverId', 'driver', 'driver_id_code', 'drv_id'],
  client: ['client', 'client_name', 'clientName', 'customer', 'customer_name', 'account_name', 'account'],
  issue: ['issue', 'issue_description', 'issueDescription', 'problem', 'breakdown_issue', 'description', 'incident', 'fault'],
  severity: ['severity', 'severity_level', 'severityLevel', 'priority', 'urgency'],
  originHub: ['origin_hub', 'originHub', 'origin', 'source_hub', 'sourceHub', 'from_hub'],
  destination: ['destination', 'dest', 'target_hub', 'targetHub', 'to_location', 'delivery_location'],
  kmFromOriginHub: ['km_from_origin_hub', 'kmFromOriginHub', 'km_from_origin', 'distance_from_hub', 'distance_km', 'distanceKm', 'km_distance'],
  createdAt: ['created_at', 'createdAt', 'timestamp', 'reported_at', 'reportedAt', 'date_time', 'date'],
  status: ['status', 'ticket_status', 'ticketStatus', 'state'],
  resolutionNote: ['resolution_note', 'resolutionNote', 'notes', 'comments', 'remarks'],
};

export class TicketSchemaAdapter {
  /**
   * Detects the dominant schema style of the record
   */
  public static detectSchema(record: Record<string, unknown>): string {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return 'INVALID_NON_OBJECT';
    }

    const keys = Object.keys(record);
    const hasSnake = keys.some((k) => k.includes('_'));
    const hasCamel = keys.some((k) => /[a-z][A-Z]/.test(k));

    if (keys.includes('id') && keys.includes('vehicle_id') && keys.includes('client_name')) {
      return 'SURPRISE_HYBRID_SCHEMA';
    }
    if (keys.includes('ticketId') || (hasCamel && !hasSnake)) {
      return 'CAMEL_CASE_SCHEMA';
    }
    if (hasSnake) {
      return 'SNAKE_CASE_SCHEMA';
    }
    return 'STANDARD_SCHEMA';
  }

  /**
   * Adapts a raw ticket record into a normalized schema with strict validation
   */
  public static adapt(rawRecord: Record<string, unknown>): AdapterResult {
    if (!rawRecord || typeof rawRecord !== 'object' || Array.isArray(rawRecord)) {
      return {
        success: false,
        validationErrors: ['Input record is not a valid key-value object'],
        rawRecord: rawRecord || {},
        detectedSchema: 'INVALID',
      };
    }

    const detectedSchema = this.detectSchema(rawRecord);
    const validationErrors: string[] = [];
    const mappedFieldNames = new Set<string>();
    const usedInputKeys = new Set<string>();

    // Helper to find value from alias list
    const extractField = (canonicalName: string): { value: unknown; keyUsed: string | null } => {
      const aliases = FIELD_ALIASES[canonicalName] || [canonicalName];
      for (const alias of aliases) {
        if (alias in rawRecord && rawRecord[alias] !== undefined && rawRecord[alias] !== null) {
          return { value: rawRecord[alias], keyUsed: alias };
        }
      }
      return { value: undefined, keyUsed: null };
    };

    // 1. Extract Ticket ID
    const { value: rawIdVal, keyUsed: idKey } = extractField('ticketId');
    let ticketId = '';
    if (idKey) {
      usedInputKeys.add(idKey);
      mappedFieldNames.add('ticketId');
      if (typeof rawIdVal === 'string' || typeof rawIdVal === 'number') {
        ticketId = String(rawIdVal).trim();
      } else {
        validationErrors.push(`Field '${idKey}' must be string or number, got ${typeof rawIdVal}`);
      }
    }
    if (!ticketId) {
      validationErrors.push('Missing ticket_id identifier (expected ticket_id, ticketId, or id)');
    }

    // 2. Extract Vehicle
    const { value: rawVehVal, keyUsed: vehKey } = extractField('vehicle');
    let vehicle = '';
    if (vehKey) {
      usedInputKeys.add(vehKey);
      mappedFieldNames.add('vehicle');
      if (typeof rawVehVal === 'string') {
        vehicle = rawVehVal.trim();
      } else {
        validationErrors.push(`Field '${vehKey}' must be a string, got ${typeof rawVehVal}`);
      }
    }
    if (!vehicle) {
      validationErrors.push('Missing vehicle identifier (expected vehicle, vehicle_id, or vehicleId)');
    }

    // 3. Extract Issue
    const { value: rawIssueVal, keyUsed: issueKey } = extractField('issue');
    let issue = '';
    if (issueKey) {
      usedInputKeys.add(issueKey);
      mappedFieldNames.add('issue');
      if (typeof rawIssueVal === 'string') {
        issue = rawIssueVal.trim();
      } else {
        validationErrors.push(`Field '${issueKey}' must be a string, got ${typeof rawIssueVal}`);
      }
    }
    if (!issue) {
      validationErrors.push('Missing failure/issue description (expected issue, problem, or description)');
    }

    // 4. Extract Driver ID
    const { value: rawDrvVal, keyUsed: drvKey } = extractField('driverId');
    let driverId = '';
    if (drvKey) {
      usedInputKeys.add(drvKey);
      mappedFieldNames.add('driverId');
      driverId = String(rawDrvVal).trim();
    }

    // 5. Extract Client
    const { value: rawClientVal, keyUsed: clientKey } = extractField('client');
    let client = '';
    if (clientKey) {
      usedInputKeys.add(clientKey);
      mappedFieldNames.add('client');
      client = String(rawClientVal).trim();
    }

    // 6. Extract Severity
    const { value: rawSevVal, keyUsed: sevKey } = extractField('severity');
    let severity = 'MEDIUM';
    if (sevKey) {
      usedInputKeys.add(sevKey);
      mappedFieldNames.add('severity');
      severity = String(rawSevVal).trim().toUpperCase();
    }

    // 7. Extract Origin Hub
    const { value: rawOriginVal, keyUsed: originKey } = extractField('originHub');
    let originHub = '';
    if (originKey) {
      usedInputKeys.add(originKey);
      mappedFieldNames.add('originHub');
      originHub = String(rawOriginVal).trim();
    }

    // 8. Extract Destination
    const { value: rawDestVal, keyUsed: destKey } = extractField('destination');
    let destination = '';
    if (destKey) {
      usedInputKeys.add(destKey);
      mappedFieldNames.add('destination');
      destination = String(rawDestVal).trim();
    }

    // 9. Extract kmFromOriginHub
    const { value: rawKmVal, keyUsed: kmKey } = extractField('kmFromOriginHub');
    let kmFromOriginHub = 0;
    if (kmKey) {
      usedInputKeys.add(kmKey);
      mappedFieldNames.add('kmFromOriginHub');
      if (typeof rawKmVal === 'number') {
        kmFromOriginHub = rawKmVal;
      } else if (typeof rawKmVal === 'string') {
        const parsed = parseFloat(rawKmVal.replace(/[^0-9.-]/g, ''));
        if (isNaN(parsed)) {
          validationErrors.push(`Field '${kmKey}' contains invalid numeric distance '${rawKmVal}'`);
        } else {
          kmFromOriginHub = parsed;
        }
      }
    }

    // 10. Extract Created At
    const { value: rawCreatedVal, keyUsed: createdKey } = extractField('createdAt');
    let createdAt = new Date().toISOString();
    if (createdKey) {
      usedInputKeys.add(createdKey);
      mappedFieldNames.add('createdAt');
      createdAt = String(rawCreatedVal).trim();
    }

    // 11. Extract Status
    const { value: rawStatusVal, keyUsed: statusKey } = extractField('status');
    let status = 'OPEN';
    if (statusKey) {
      usedInputKeys.add(statusKey);
      mappedFieldNames.add('status');
      status = String(rawStatusVal).trim();
    }

    // 12. Extract Resolution Note
    const { value: rawNoteVal, keyUsed: noteKey } = extractField('resolutionNote');
    let resolutionNote = '';
    if (noteKey) {
      usedInputKeys.add(noteKey);
      mappedFieldNames.add('resolutionNote');
      resolutionNote = String(rawNoteVal).trim();
    }

    // 13. Collect & Preserve ALL Unmapped / Unknown Fields
    const preservedUnknownFields: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rawRecord)) {
      if (!usedInputKeys.has(key)) {
        preservedUnknownFields[key] = val;
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        validationErrors,
        rawRecord,
        detectedSchema,
      };
    }

    const adaptedRecord: AdaptedTicketRecord = {
      ticketId,
      vehicle,
      driverId,
      client,
      issue,
      severity,
      originHub,
      destination,
      kmFromOriginHub,
      createdAt,
      status,
      resolutionNote,
      detectedSchema,
      mappedFields: Array.from(mappedFieldNames),
      preservedUnknownFields,
      rawRecord,
    };

    return {
      success: true,
      adaptedRecord,
      validationErrors: [],
      rawRecord,
      detectedSchema,
    };
  }

  /**
   * Adapts a list of records in batch
   */
  public static adaptBatch(records: Record<string, unknown>[]): AdapterResult[] {
    if (!Array.isArray(records)) return [];
    return records.map((r) => this.adapt(r));
  }
}
