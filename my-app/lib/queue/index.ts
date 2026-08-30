/**
 * Module 1: Breakdown Queue Ingestion, Validation, and Idempotency Engine
 * Flow: tickets.json -> Ingestion -> Validation -> PII Masking -> Normalization -> Duplicate Detection -> Store
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { QueueTicket, QueueStats, BreakdownTicket } from '../types';
import { maskPii } from '../pii';
import { normalizeVehicleReg, normalizeDriverId, normalizeClientName, normalizeStatus } from '../normalization';
import { EntityResolver } from '../entity-resolution';
import { QuarantineManager } from '../quarantine';
import { UnifiedContextStore } from '../context';

export interface TicketIngestionOptions {
  dataDir?: string;
  customTickets?: Record<string, unknown>[];
  runId?: string;
}

export interface TicketIngestionResult {
  ingestionRunId: string;
  totalRecordsProcessed: number;
  validTickets: QueueTicket[];
  duplicateTickets: QueueTicket[];
  quarantinedTickets: QueueTicket[];
  stats: QueueStats;
  timestamp: string;
}

export class BreakdownQueueService {
  private static instance: BreakdownQueueService;
  private store = UnifiedContextStore.getInstance();
  private entityResolver = new EntityResolver();
  private quarantineManager = new QuarantineManager();

  public static getInstance(): BreakdownQueueService {
    if (!BreakdownQueueService.instance) {
      BreakdownQueueService.instance = new BreakdownQueueService();
    }
    return BreakdownQueueService.instance;
  }

  /**
   * Initializes vehicle aliases from Context Store for accurate vehicle resolution
   */
  private async initResolvers() {
    const vehicles = await this.store.getAllVehicles();
    for (const v of vehicles) {
      this.entityResolver.registerVehicleAlias(v.registrationNumber, v.registrationNumber);
      if (v.vehicleId) {
        this.entityResolver.registerVehicleAlias(v.vehicleId, v.registrationNumber);
      }
      for (const a of v.aliases || []) {
        this.entityResolver.registerVehicleAlias(a, v.registrationNumber);
      }
    }

    const drivers = await this.store.getAllDrivers();
    for (const d of drivers) {
      this.entityResolver.registerDriverAlias(d.driverId, d.driverId);
    }
  }

  /**
   * Ingests, validates, masks PII, normalizes, and classifies tickets
   */
  public async ingestTickets(options: TicketIngestionOptions = {}): Promise<TicketIngestionResult> {
    await this.initResolvers();

    const baseDir = options.dataDir || path.join(process.cwd(), '../data');
    const fallbackDir = path.join(process.cwd(), 'data');
    const dataDir = fs.existsSync(baseDir) ? baseDir : fallbackDir;
    const ingestionRunId = options.runId || `queue_run_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    let rawList: Record<string, unknown>[] = [];

    if (options.customTickets) {
      rawList = options.customTickets;
    } else {
      const ticketsPath = path.join(dataDir, 'tickets.json');
      if (fs.existsSync(ticketsPath)) {
        const content = fs.readFileSync(ticketsPath, 'utf-8');
        rawList = JSON.parse(content) as Record<string, unknown>[];
      }
    }

    const validTickets: QueueTicket[] = [];
    const duplicateTickets: QueueTicket[] = [];
    const quarantinedTickets: QueueTicket[] = [];

    const seenCanonicalKeys = new Set<string>();

    for (let index = 0; index < rawList.length; index++) {
      const rawRecord = rawList[index];

      // 1. PII Masking
      const { data: maskedRecord } = maskPii(rawRecord);

      const rawTicketId = String(maskedRecord['ticket_id'] || '').trim();
      const rawVehicle = String(maskedRecord['vehicle'] || '').trim();
      const rawDriver = String(maskedRecord['driver_id'] || '').trim();
      const rawIssue = String(maskedRecord['issue'] || '').trim();
      const rawSeverity = String(maskedRecord['severity'] || 'MEDIUM').toUpperCase().trim();
      const rawClient = String(maskedRecord['client'] || '').trim();
      const rawOriginHub = String(maskedRecord['origin_hub'] || '').trim();
      const rawDestination = String(maskedRecord['destination'] || '').trim();
      const rawKm = parseInt(String(maskedRecord['km_from_origin_hub']), 10) || 0;
      const rawCreatedAt = String(maskedRecord['created_at'] || new Date().toISOString()).trim();
      const rawStatus = String(maskedRecord['status'] || 'OPEN').trim();
      const resolutionNote = String(maskedRecord['resolution_note'] || '').trim();

      // 2. Validation Checks
      const validationErrors: string[] = [];
      if (!rawTicketId) {
        validationErrors.push('Missing ticket_id identifier');
      }

      const normVehicle = normalizeVehicleReg(rawVehicle);
      const resVehicle = this.entityResolver.resolveVehicleId(normVehicle);
      if (!rawVehicle || !resVehicle.canonicalId || resVehicle.status === 'UNRESOLVED') {
        validationErrors.push(`Unrecognized or invalid vehicle identifier '${rawVehicle}'`);
      }

      if (!rawIssue) {
        validationErrors.push('Missing failure/issue description');
      }

      const canonicalTicketId = rawTicketId.toUpperCase();
      const idempotencyKey = `BREAKDOWN:${canonicalTicketId}`;

      // 3. Quarantine Classification (Invalid tickets)
      if (validationErrors.length > 0) {
        const quarantineRecord = this.quarantineManager.quarantine(
          'tickets.json',
          rawTicketId || `INVALID_TKT_${index + 1}`,
          validationErrors.join('; '),
          validationErrors,
          rawRecord,
          ingestionRunId
        );
        await this.store.saveQuarantine(quarantineRecord);

        const quarantinedTicket: QueueTicket = {
          ticketId: rawTicketId || `QUARANTINED_${index + 1}`,
          idempotencyKey: `QUARANTINED:${rawTicketId || index + 1}`,
          canonicalTicketId: rawTicketId || `QUARANTINED_${index + 1}`,
          createdAt: rawCreatedAt,
          vehicle: normVehicle || rawVehicle,
          rawVehicle,
          driverId: normalizeDriverId(rawDriver) || rawDriver,
          rawDriverId: rawDriver,
          originHub: rawOriginHub,
          kmFromOriginHub: rawKm,
          destination: rawDestination,
          issue: rawIssue || '[MISSING ISSUE]',
          severity: rawSeverity,
          client: normalizeClientName(rawClient) || rawClient,
          status: 'QUARANTINED',
          originalStatus: rawStatus,
          resolutionNote,
          isDuplicate: false,
          isQuarantined: true,
          quarantineReason: validationErrors.join('; '),
          validationErrors,
          ingestionRunId,
          sourceFile: 'tickets.json',
        };

        await this.store.saveQueueTicket(quarantinedTicket);
        quarantinedTickets.push(quarantinedTicket);
        continue;
      }

      // 4. Duplicate Detection & Idempotency
      const normDriverId = normalizeDriverId(rawDriver) || rawDriver;
      const canonicalClient = normalizeClientName(rawClient);

      // Check if ticket was seen in current batch or existing database
      const existingTicket = await this.store.getQueueTicket(canonicalTicketId);
      const isDuplicateInBatch = seenCanonicalKeys.has(canonicalTicketId);

      if (isDuplicateInBatch || (existingTicket && existingTicket.isDuplicate === false && !seenCanonicalKeys.has(canonicalTicketId))) {
        if (isDuplicateInBatch) {
          // This is a duplicate record inside the same feed
          const duplicateTicket: QueueTicket = {
            ticketId: `${canonicalTicketId}_DUP_${index + 1}`,
            idempotencyKey: `BREAKDOWN:${canonicalTicketId}:DUP:${index + 1}`,
            canonicalTicketId,
            createdAt: rawCreatedAt,
            vehicle: resVehicle.canonicalId,
            rawVehicle,
            driverId: normDriverId,
            rawDriverId: rawDriver,
            originHub: rawOriginHub,
            kmFromOriginHub: rawKm,
            destination: rawDestination,
            issue: rawIssue,
            severity: rawSeverity,
            client: canonicalClient,
            status: 'DUPLICATE',
            originalStatus: rawStatus,
            resolutionNote,
            isDuplicate: true,
            duplicateOf: canonicalTicketId,
            isQuarantined: false,
            ingestionRunId,
            sourceFile: 'tickets.json',
          };

          await this.store.saveQueueTicket(duplicateTicket);
          duplicateTickets.push(duplicateTicket);
          continue;
        } else {
          // Ingestion rerun idempotency: keep existing status (e.g. PROCESSING, COMPLETED, READY)
          seenCanonicalKeys.add(canonicalTicketId);
          if (existingTicket) {
            validTickets.push(existingTicket);
          }
          continue;
        }
      }

      // 5. Valid Ticket -> READY
      seenCanonicalKeys.add(canonicalTicketId);

      const validTicket: QueueTicket = {
        ticketId: canonicalTicketId,
        idempotencyKey,
        canonicalTicketId,
        createdAt: rawCreatedAt,
        vehicle: resVehicle.canonicalId,
        rawVehicle,
        driverId: normDriverId,
        rawDriverId: rawDriver,
        originHub: rawOriginHub,
        kmFromOriginHub: rawKm,
        destination: rawDestination,
        issue: rawIssue,
        severity: rawSeverity,
        client: canonicalClient,
        status: 'READY',
        originalStatus: rawStatus,
        resolutionNote,
        isDuplicate: false,
        isQuarantined: false,
        ingestionRunId,
        sourceFile: 'tickets.json',
      };

      await this.store.saveQueueTicket(validTicket);

      // Also persist to Context Foundation tickets collection
      const legacyTicket: BreakdownTicket = {
        ticketId: canonicalTicketId,
        createdAt: rawCreatedAt,
        vehicle: resVehicle.canonicalId,
        driverId: normDriverId,
        originHub: rawOriginHub,
        kmFromOriginHub: rawKm,
        destination: rawDestination,
        issue: rawIssue,
        severity: rawSeverity,
        client: canonicalClient,
        status: normalizeStatus(rawStatus),
        resolutionNote,
      };
      await this.store.saveTicket(legacyTicket);

      validTickets.push(validTicket);
    }

    const stats = await this.store.getQueueStats();

    return {
      ingestionRunId,
      totalRecordsProcessed: rawList.length,
      validTickets,
      duplicateTickets,
      quarantinedTickets,
      stats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieves all tickets with optional filtering
   */
  public async getTickets(filters: {
    search?: string;
    status?: string;
    severity?: string;
  } = {}): Promise<{ tickets: QueueTicket[]; stats: QueueStats }> {
    let tickets = await this.store.getAllQueueTickets();
    if (tickets.length === 0) {
      await this.ingestTickets();
      tickets = await this.store.getAllQueueTickets();
    }

    if (filters.status && filters.status !== 'ALL') {
      tickets = tickets.filter((t) => t.status === filters.status);
    }

    if (filters.severity && filters.severity !== 'ALL') {
      tickets = tickets.filter((t) => t.severity === filters.severity);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.ticketId.toLowerCase().includes(q) ||
          t.vehicle.toLowerCase().includes(q) ||
          t.client.toLowerCase().includes(q) ||
          t.issue.toLowerCase().includes(q) ||
          t.originHub.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q)
      );
    }

    const stats = await this.store.getQueueStats();
    return { tickets, stats };
  }

  /**
   * Retrieves a single ticket with fully resolved vehicle, driver, and client context
   */
  public async getTicketDetail(ticketId: string): Promise<{
    ticket: QueueTicket | null;
    vehicleContext: unknown;
    driverContext: unknown;
    clientContext: unknown;
  }> {
    let ticket = await this.store.getQueueTicket(ticketId);
    if (!ticket) {
      await this.ingestTickets();
      ticket = await this.store.getQueueTicket(ticketId);
    }

    if (!ticket) {
      return {
        ticket: null,
        vehicleContext: null,
        driverContext: null,
        clientContext: null,
      };
    }

    const vehicleContext = ticket.vehicle ? await this.store.getVehicle(ticket.vehicle) : null;
    const driverContext = ticket.driverId ? await this.store.getDriver(ticket.driverId) : null;
    const clientContext = ticket.client ? await this.store.getClient(ticket.client) : null;

    return {
      ticket,
      vehicleContext,
      driverContext,
      clientContext,
    };
  }

  /**
   * Updates a ticket status in the queue idempotently
   */
  public async processTicket(ticketId: string, targetStatus?: 'PROCESSING' | 'COMPLETED'): Promise<QueueTicket | null> {
    const existing = await this.store.getQueueTicket(ticketId);
    if (!existing) {
      return null;
    }

    if (existing.isQuarantined || existing.isDuplicate) {
      return existing; // Cannot process duplicate or quarantined ticket downstream
    }

    const nextStatus = targetStatus || (existing.status === 'READY' ? 'PROCESSING' : 'COMPLETED');
    return this.store.updateQueueTicketStatus(ticketId, nextStatus);
  }

  /**
   * Retrieves all quarantined tickets
   */
  public async getQuarantineTickets(): Promise<QueueTicket[]> {
    let quarantined = await this.store.getQuarantinedQueueTickets();
    if (quarantined.length === 0) {
      await this.ingestTickets();
      quarantined = await this.store.getQuarantinedQueueTickets();
    }
    return quarantined;
  }
}
