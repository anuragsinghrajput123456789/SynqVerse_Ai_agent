'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Info, RefreshCw, Calendar } from 'lucide-react';
import AnalyticsOverviewCards from '../components/reports/AnalyticsOverviewCards';
import IncidentPerformanceSection from '../components/reports/IncidentPerformanceSection';
import FleetSafetySection from '../components/reports/FleetSafetySection';

import {
  OperationsOverviewMetrics,
  IncidentPerformanceMetrics,
  FleetHealthMetrics,
  DriverSafetyMetrics,
  WorkOrderMetrics,
  AiUsageMetrics,
  DateRange,
} from '@/lib/analytics/types';

export default function ReportsAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ metric: string; value: string; time: string } | null>(null);

  const [overview, setOverview] = useState<OperationsOverviewMetrics | null>(null);
  const [incidents, setIncidents] = useState<IncidentPerformanceMetrics | null>(null);
  const [fleet, setFleet] = useState<FleetHealthMetrics | null>(null);
  const [safety, setSafety] = useState<DriverSafetyMetrics | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrderMetrics | null>(null);
  const [aiUsage, setAiUsage] = useState<AiUsageMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ range: dateRange });
      if (dateRange === 'custom') {
        if (customStart) queryParams.set('startDate', customStart);
        if (customEnd) queryParams.set('endDate', customEnd);
      }

      const queryString = queryParams.toString();
      const [overviewRes, incidentsRes, fleetRes, safetyRes, woRes, aiRes] = await Promise.all([
        fetch(`/api/analytics/overview?${queryString}`),
        fetch(`/api/analytics/incidents?${queryString}`),
        fetch('/api/analytics/fleet'),
        fetch('/api/analytics/safety'),
        fetch('/api/analytics/work-orders'),
        fetch('/api/analytics/ai'),
      ]);

      if (overviewRes.ok) {
        const d = await overviewRes.json();
        setOverview(d.data);
      }
      if (incidentsRes.ok) {
        const d = await incidentsRes.json();
        setIncidents(d.data);
      }
      if (fleetRes.ok) {
        const d = await fleetRes.json();
        setFleet(d.data);
      }
      if (safetyRes.ok) {
        const d = await safetyRes.json();
        setSafety(d.data);
      }
      if (woRes.ok) {
        const d = await woRes.json();
        setWorkOrders(d.data);
      }
      if (aiRes.ok) {
        const d = await aiRes.json();
        setAiUsage(d.data);
      }
      setLastUpdated(new Date().toISOString());
    } catch {
      // Graceful degradation on connection failure
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const exportCSV = () => {
    if (!overview || !incidents || !fleet) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Section,Metric,Value,Period\n' +
      `Operations,Active Incidents,${overview.activeIncidents},${dateRange}\n` +
      `Operations,Resolved Incidents,${overview.resolvedIncidents},${dateRange}\n` +
      `Operations,Average Resolution Time,${overview.averageResolutionTimeMin} mins,${dateRange}\n` +
      `Operations,Pending Approvals,${overview.pendingApprovals},${dateRange}\n` +
      `Fleet,Vehicles Available,${fleet.vehiclesAvailable},Live\n` +
      `Fleet,In Maintenance,${fleet.vehiclesInMaintenance},Live\n` +
      `Fleet,On Active Trip,${fleet.vehiclesOnTrip},Live\n` +
      `Safety,Active Emergencies,${safety?.activeEmergencies || 0},Live\n` +
      `Safety,Avg Response Time,${safety?.averageResponseTimeMin || 0} mins,${dateRange}\n` +
      `Work Orders,Total Created,${workOrders?.createdCount || 0},${dateRange}\n` +
      `AI Operations,Copilot Queries,${aiUsage?.copilotQueries || 0},${dateRange}\n`;
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `grafity_analytics_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 1. Header with Title, Range Selector, Custom Dates & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Operations &amp; Executive Analytics
            </h1>
            <span className="text-[11px] font-mono font-medium bg-indigo-50 text-[#6D5DF5] border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Live Aggregation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative operational indicators, dispatch SLA trends, fleet availability, and safety telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter Tabs */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-xs">
            {(['today', '7d', '30d', '90d', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                  dateRange === r
                    ? 'bg-[#6D5DF5] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {r === 'today' ? 'Today' : r === 'custom' ? 'Custom' : r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics()}
            title="Refresh metrics"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#6D5DF5]' : ''}`} />
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#6D5DF5]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker bar (when 'custom' is active) */}
      {dateRange === 'custom' && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Calendar className="w-4 h-4 text-[#6D5DF5]" />
            <span>Select Custom Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 text-[11px]">Start Date:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D5DF5]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 text-[11px]">End Date:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#6D5DF5]"
            />
          </div>

          <button
            onClick={() => fetchAnalytics()}
            className="px-3 py-1.5 rounded-lg bg-[#6D5DF5] text-white text-xs font-semibold hover:bg-[#5B4BE3] transition-colors"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Interactive Tooltip Bar if hovering */}
      {hoveredPoint && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs text-indigo-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#6D5DF5]" />
            <span className="font-semibold">{hoveredPoint.metric}:</span>
            <span className="font-mono font-bold text-slate-900">{hoveredPoint.value}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Period: {hoveredPoint.time}</span>
        </div>
      )}

      {/* 1. OPERATIONS OVERVIEW */}
      <AnalyticsOverviewCards overview={overview} loading={loading} lastUpdated={lastUpdated} />

      {/* 2. INCIDENT PERFORMANCE */}
      <IncidentPerformanceSection incidents={incidents} loading={loading} onHoverPoint={setHoveredPoint} />

      {/* 3–7. FLEET HEALTH, DRIVER SAFETY, WORK ORDERS, AI UTILIZATION, INFRASTRUCTURE */}
      <FleetSafetySection
        fleet={fleet}
        safety={safety}
        workOrders={workOrders}
        aiUsage={aiUsage}
        loading={loading}
      />
    </div>
  );
}
