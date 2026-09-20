/**
 * Data Studio Shared Types
 * Used by both client components and server API routes to maintain strict boundary separation.
 */

export interface ExtractedLogisticsRecord {
  id: string;
  vehicleId: string;
  driverName: string;
  status: 'NOMINAL' | 'ACTIVE' | 'DELAYED' | 'BREAKDOWN' | 'CRITICAL' | 'MAINTENANCE' | 'UNKNOWN';
  corridor: string;
  delayHours: number;
  estimatedCost: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes: string;
  timestamp: string;
  raw: Record<string, unknown>;
}

export interface DocumentAnalysisResult {
  fileName: string;
  fileType: string;
  recordCount: number;
  records: ExtractedLogisticsRecord[];
  summary: {
    totalRecords: number;
    nominalCount: number;
    delayedCount: number;
    criticalBreakdownCount: number;
    maintenanceCount: number;
    operationalRatePct: number;
    totalDelayHours: number;
    totalEstimatedCost: number;
    topCorridor: string;
  };
  insights: string[];
  recommendations: string[];
}
