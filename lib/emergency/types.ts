export type SOSStatus =
  | 'READY'
  | 'CONFIRMING'
  | 'SENDING'
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'RESPONDING'
  | 'RESOLVED'
  | 'FAILED';

export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface EmergencyTimelineEvent {
  status: SOSStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface EmergencyEvent {
  id: string; // e.g. SOS-1042
  driverId: string;
  driverName: string;
  driverPhone?: string; // masked in UI
  vehicleId: string;
  vehicleRegistration: string;
  tripId?: string;
  status: SOSStatus;
  priority: EmergencyPriority;
  severity?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  locationName?: string;
  accuracyMeters?: number;
  emergencyType: string;
  description?: string;
  notes?: string;
  breakdownId?: string;
  triggeredAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  acknowledgedBy?: string | null;
  resolvedBy?: string | null;
  relatedIncidentId?: string | null;
  timeline: EmergencyTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSOSInput {
  driverId: string;
  vehicleRegistration?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationName?: string;
  emergencyType?: string;
  description?: string;
  tripId?: string;
}
