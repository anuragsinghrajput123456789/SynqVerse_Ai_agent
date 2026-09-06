/**
 * Unified Context Store Service
 * Coordinates access across MongoDB repositories and handles context retrieval.
 */

import {
  VehicleRepository,
  DriverRepository,
  ClientRepository,
  TicketRepository,
  ResolvedEntityRepository,
  ConflictRepository,
  QuarantineRepository,
  QueueRepository,
  DecisionRepository,
  inMemoryTestStore,
} from '../repositories';
import {
  Vehicle,
  Driver,
  Client,
  BreakdownTicket,
  ResolvedEntity,
  Conflict,
  QuarantineRecord,
  IngestionStatus,
  QueueTicket,
  QueueTicketStatus,
  QueueStats,
  DecisionRecord,
} from '../types';

export class UnifiedContextStore {
  private static instance: UnifiedContextStore;

  private vehicleRepo = new VehicleRepository();
  private driverRepo = new DriverRepository();
  private clientRepo = new ClientRepository();
  private ticketRepo = new TicketRepository();
  private entityRepo = new ResolvedEntityRepository();
  private conflictRepo = new ConflictRepository();
  private quarantineRepo = new QuarantineRepository();
  private queueRepo = new QueueRepository();
  private decisionRepo = new DecisionRepository();

  public static getInstance(): UnifiedContextStore {
    if (!UnifiedContextStore.instance) {
      UnifiedContextStore.instance = new UnifiedContextStore();
    }
    return UnifiedContextStore.instance;
  }

  public async saveVehicle(v: Vehicle) {
    await this.vehicleRepo.upsertVehicle(v);
  }

  public async saveDriver(d: Driver) {
    await this.driverRepo.upsertDriver(d);
  }

  public async saveClient(c: Client) {
    await this.clientRepo.upsertClient(c);
  }

  public async saveTicket(t: BreakdownTicket) {
    await this.ticketRepo.upsertTicket(t);
  }

  public async saveResolvedEntity(re: ResolvedEntity) {
    await this.entityRepo.upsertEntity(re);
  }

  public async saveConflict(c: Conflict) {
    await this.conflictRepo.upsertConflict(c);
  }

  public async saveQuarantine(q: QuarantineRecord) {
    await this.quarantineRepo.upsertQuarantine(q);
  }

  public async saveQueueTicket(qt: QueueTicket) {
    await this.queueRepo.upsertQueueTicket(qt);
  }

  public async getQueueTicket(ticketId: string): Promise<QueueTicket | null> {
    return this.queueRepo.findByTicketId(ticketId);
  }

  public async getQueueTicketByIdempotencyKey(key: string): Promise<QueueTicket | null> {
    return this.queueRepo.findByIdempotencyKey(key);
  }

  public async getAllQueueTickets(): Promise<QueueTicket[]> {
    return this.queueRepo.findAll();
  }

  public async getQuarantinedQueueTickets(): Promise<QueueTicket[]> {
    return this.queueRepo.findQuarantined();
  }

  public async updateQueueTicketStatus(
    ticketId: string,
    status: QueueTicketStatus,
    processedAt?: string
  ): Promise<QueueTicket | null> {
    return this.queueRepo.updateStatus(ticketId, status, processedAt);
  }

  public async getQueueStats(): Promise<QueueStats> {
    return this.queueRepo.getStats();
  }

  public async saveDecision(d: DecisionRecord) {
    await this.decisionRepo.upsertDecision(d);
  }

  public async getDecision(decisionId: string): Promise<DecisionRecord | null> {
    return this.decisionRepo.findByDecisionId(decisionId);
  }

  public async getDecisionByTicketId(ticketId: string): Promise<DecisionRecord | null> {
    return this.decisionRepo.findByTicketId(ticketId);
  }

  public async getAllDecisions(): Promise<DecisionRecord[]> {
    return this.decisionRepo.findAll();
  }

  public async getVehicle(query: string): Promise<Vehicle | null> {
    if (!query) return null;
    const clean = query.trim().toUpperCase().replace(/[\s\-]+/g, '');
    const all = await this.vehicleRepo.findAll();
    for (const v of all) {
      if (v.registrationNumber.replace(/[\s\-]+/g, '').toUpperCase() === clean) return v;
      if (v.vehicleId && v.vehicleId.replace(/[\s\-]+/g, '').toUpperCase() === clean) return v;
      if (v.aliases.some((a) => a.replace(/[\s\-]+/g, '').toUpperCase() === clean)) return v;
    }
    return null;
  }

  public async getDriver(query: string): Promise<Driver | null> {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    const all = await this.driverRepo.findAll();
    for (const d of all) {
      if (d.driverId.toLowerCase() === clean) return d;
      if (d.name.toLowerCase().includes(clean)) return d;
    }
    return null;
  }

  public async getClient(query: string): Promise<Client | null> {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    const all = await this.clientRepo.findAll();
    for (const c of all) {
      if (c.name.toLowerCase().includes(clean)) return c;
    }
    return null;
  }

  public async getResolvedEntity(id: string): Promise<ResolvedEntity | null> {
    return this.entityRepo.findById(id);
  }

  public async getAllResolvedEntities(): Promise<ResolvedEntity[]> {
    return this.entityRepo.findAll();
  }

  public async getAllVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepo.findAll();
  }

  public async getAllDrivers(): Promise<Driver[]> {
    return this.driverRepo.findAll();
  }

  public async getAllClients(): Promise<Client[]> {
    return this.clientRepo.findAll();
  }

  public async getAllTickets(): Promise<BreakdownTicket[]> {
    return this.ticketRepo.findAll();
  }

  public async getAllConflicts(): Promise<Conflict[]> {
    return this.conflictRepo.findAll();
  }

  public async getAllQuarantine(): Promise<QuarantineRecord[]> {
    return this.quarantineRepo.findAll();
  }

  public setStatus(status: IngestionStatus) {
    inMemoryTestStore.status = status;
  }

  public getStatus(): IngestionStatus | null {
    return inMemoryTestStore.status;
  }
}
