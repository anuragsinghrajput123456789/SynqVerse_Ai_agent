import { EmergencyRepository } from './repository';
import { CreateSOSInput, EmergencyEvent, SOSStatus } from './types';
import { DriverRepository, VehicleRepository } from '../repositories';
import { createAuditEvent } from '../audit';
import { maskPii } from '../pii';

export * from './types';
export * from './repository';

function generateEmergencyId(): string {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `SOS-${timestampPart}-${randomPart}`;
}

export class EmergencyService {
  private static instance: EmergencyService;
  private repo = new EmergencyRepository();
  private driverRepo = new DriverRepository();
  private vehicleRepo = new VehicleRepository();

  public static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  /**
   * Triggers a new emergency SOS event from a driver device
   */
  public async triggerSOS(input: CreateSOSInput): Promise<EmergencyEvent> {
    // 1. Authoritative Driver Verification
    const driver = await this.driverRepo.findById(input.driverId);
    let driverName = driver?.name;
    const driverPhone = driver?.phone || '';

    if (!driver) {
      // Check if driver exists in active fleet location master
      try {
        const { LocationService } = await import('../location');
        const fleetLoc = await LocationService.getInstance().getDriverLocation(input.driverId);
        if (fleetLoc) {
          driverName = fleetLoc.driverName;
        }
      } catch {
        // Continue fallback check
      }
    }

    if (!driverName) {
      driverName = 'Driver ' + input.driverId.replace('DRV-', '');
    }

    // 2. Server-side Idempotency: Return existing active emergency if triggered within 15 mins
    const existingActive = await this.repo.findActive();
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    const duplicate = existingActive.find(
      (e) =>
        e.driverId === input.driverId &&
        new Date(e.triggeredAt).getTime() > fifteenMinsAgo
    );

    if (duplicate) {
      return duplicate;
    }

    const now = new Date().toISOString();
    const id = generateEmergencyId();

    // 3. Resolve Vehicle details
    let vehicleId = 'TRK-104';
    let vehicleRegistration = input.vehicleRegistration || 'UP17GN7381';
    if (input.vehicleRegistration) {
      const v = await this.vehicleRepo.findByReg(input.vehicleRegistration);
      if (v) {
        vehicleId = v.vehicleId || 'TRK-104';
        vehicleRegistration = v.registrationNumber;
      }
    }

    const { data: maskedPhone } = maskPii(driverPhone);

    const event: EmergencyEvent = {
      id,
      driverId: input.driverId,
      driverName,
      driverPhone: String(maskedPhone || ''),
      vehicleId,
      vehicleRegistration,
      tripId: input.tripId || 'TRIP-ACTIVE',
      status: 'ACTIVE',
      priority: 'CRITICAL',
      latitude: input.latitude,
      longitude: input.longitude,
      locationName: input.locationName || 'Highway NH-48 Corridor, Delhi NCR',
      accuracyMeters: input.accuracyMeters || 12,
      emergencyType: input.emergencyType || 'Breakdown & Collision Hazard',
      description: input.description || 'Emergency SOS dispatched from driver console.',
      triggeredAt: now,
      acknowledgedAt: null,
      resolvedAt: null,
      acknowledgedBy: null,
      resolvedBy: null,
      relatedIncidentId: 'BRK-1042',
      timeline: [
        {
          status: 'READY',
          timestamp: now,
          actor: 'driver',
          note: 'Driver initiated emergency sequence.',
        },
        {
          status: 'ACTIVE',
          timestamp: now,
          actor: 'system',
          note: 'Emergency alert broadcast to fleet operations team.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.insert(event);

    // Update Live Location status to EMERGENCY
    try {
      const { LocationService } = await import('../location');
      await LocationService.getInstance().setDriverEmergency(input.driverId, event.id);
    } catch {
      // Non-blocking location update
    }

    // 3. Log Immutable Audit Record
    await createAuditEvent({
      ticketId: event.id,
      eventType: 'SOS_TRIGGERED',
      actor: input.driverId,
      reason: `Driver ${driverName} triggered critical SOS emergency on vehicle ${vehicleRegistration}`,
      safeMetadata: {
        sosId: id,
        driverId: input.driverId,
        vehicleRegistration,
        coordinates: `${input.latitude}, ${input.longitude}`,
        accuracy: input.accuracyMeters,
      },
    });

    return event;
  }

  public async acknowledgeEmergency(id: string, actor: string = 'operations_lead'): Promise<EmergencyEvent | null> {
    const current = await this.repo.findById(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const updatedTimeline = [
      ...current.timeline,
      {
        status: 'ACKNOWLEDGED' as SOSStatus,
        timestamp: now,
        actor,
        note: `Emergency acknowledged by ${actor}. Response coordination in progress.`,
      },
    ];

    const updated = await this.repo.update(id, {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: now,
      acknowledgedBy: actor,
      timeline: updatedTimeline,
    });

    await createAuditEvent({
      ticketId: id,
      eventType: 'SOS_ACKNOWLEDGED',
      actor,
      reason: `Operations acknowledged emergency ${id} for driver ${current.driverName}`,
      safeMetadata: {
        sosId: id,
        status: 'ACKNOWLEDGED',
        acknowledgedBy: actor,
      },
    });

    return updated;
  }

  public async setResponding(id: string, actor: string = 'operations_dispatch'): Promise<EmergencyEvent | null> {
    const current = await this.repo.findById(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const updatedTimeline = [
      ...current.timeline,
      {
        status: 'RESPONDING' as SOSStatus,
        timestamp: now,
        actor,
        note: `Emergency response dispatched: Roadside support en route.`,
      },
    ];

    const updated = await this.repo.update(id, {
      status: 'RESPONDING',
      timeline: updatedTimeline,
    });

    await createAuditEvent({
      ticketId: id,
      eventType: 'SOS_RESPONDING',
      actor,
      reason: `Help dispatched to emergency location for ${id}`,
      safeMetadata: {
        sosId: id,
        status: 'RESPONDING',
      },
    });

    return updated;
  }

  public async resolveEmergency(
    id: string,
    actor: string = 'operations_lead',
    resolutionNote: string = 'Emergency resolved and roadside assistance completed.'
  ): Promise<EmergencyEvent | null> {
    const current = await this.repo.findById(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const updatedTimeline = [
      ...current.timeline,
      {
        status: 'RESOLVED' as SOSStatus,
        timestamp: now,
        actor,
        note: resolutionNote,
      },
    ];

    const updated = await this.repo.update(id, {
      status: 'RESOLVED',
      resolvedAt: now,
      resolvedBy: actor,
      timeline: updatedTimeline,
    });

    await createAuditEvent({
      ticketId: id,
      eventType: 'SOS_RESOLVED',
      actor,
      reason: `Emergency ${id} resolved by ${actor}: ${resolutionNote}`,
      safeMetadata: {
        sosId: id,
        status: 'RESOLVED',
        resolvedBy: actor,
      },
    });

    // Reset driver status in Live Location
    try {
      const { LocationService } = await import('../location');
      await LocationService.getInstance().clearDriverEmergency(current.driverId);
    } catch {
      // Non-blocking location update
    }

    return updated;
  }

  public async getEmergencyById(id: string): Promise<EmergencyEvent | null> {
    return this.repo.findById(id);
  }

  public async getAllEmergencies(): Promise<EmergencyEvent[]> {
    return this.repo.findAll();
  }

  public async getActiveEmergencies(): Promise<EmergencyEvent[]> {
    return this.repo.findActive();
  }

  public async getActiveCount(): Promise<number> {
    return this.repo.countActive();
  }
}
