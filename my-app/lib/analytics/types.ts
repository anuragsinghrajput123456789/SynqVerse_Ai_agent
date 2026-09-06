export type DateRange = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface OperationsOverviewMetrics {
  activeIncidents: number;
  resolvedIncidents: number;
  averageResolutionTimeMin: number;
  pendingApprovals: number;
  activeEmergencies: number;
  driversOnline: number;
  resolutionRatePct: number;
  lastUpdated: string;
}

export interface IncidentTrendPoint {
  date: string;
  count: number;
  resolved: number;
}

export interface SeverityCount {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  percentage: number;
}

export interface IncidentCauseCount {
  cause: string;
  count: number;
  percentage: number;
}

export interface IncidentPerformanceMetrics {
  totalIncidents: number;
  incidentsOverTime: IncidentTrendPoint[];
  incidentsBySeverity: SeverityCount[];
  averageResolutionTimeMin: number;
  resolutionTimeTrend: Array<{ date: string; avgMinutes: number }>;
  topCauses: IncidentCauseCount[];
  insight?: string;
  lastUpdated: string;
}

export interface FleetHealthMetrics {
  totalVehicles: number;
  vehiclesAvailable: number;
  vehiclesInMaintenance: number;
  vehiclesOnTrip: number;
  vehiclesOffline: number;
  utilizationRatePct: number;
  insight?: string;
  lastUpdated: string;
}

export interface EmergencyTrendPoint {
  date: string;
  triggered: number;
  resolved: number;
}

export interface EmergencyStatusCount {
  status: string;
  count: number;
}

export interface DriverSafetyMetrics {
  activeEmergencies: number;
  emergenciesThisWeek: number;
  averageAcknowledgementTimeSec: number;
  averageResponseTimeMin: number;
  emergencyTrend: EmergencyTrendPoint[];
  statusDistribution: EmergencyStatusCount[];
  insight?: string;
  lastUpdated: string;
}

export interface WorkOrderMetrics {
  createdCount: number;
  inProgressCount: number;
  completedCount: number;
  failedCount: number;
  completionRatePct: number;
  averageCompletionTimeMin: number;
  pendingWorkOrders: number;
  insight?: string;
  lastUpdated: string;
}

export interface AiUsageMetrics {
  isAvailable: boolean;
  copilotQueries: number;
  voiceSessions: number;
  aiRequests: number;
  successfulResponses: number;
  aiErrors: number;
  successRatePct: number;
  lastUpdated: string;
}

export interface SystemHealthMetrics {
  status: 'healthy' | 'degraded' | 'error';
  databaseLatencyMs: number;
  uptimeSeconds: number;
  operationalRulesCount: number;
  telemetryIngestionRatePerMin: number;
  lastUpdated: string;
}
