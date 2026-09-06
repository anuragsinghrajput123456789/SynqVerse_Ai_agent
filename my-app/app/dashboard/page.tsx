'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import MetricsGrid from '../components/dashboard/MetricsGrid';
import IncidentTrend from '../components/dashboard/IncidentTrend';
import SeverityChart from '../components/dashboard/SeverityChart';
import RecentIncidents, { TicketSummary } from '../components/dashboard/RecentIncidents';
import RecentActivity, { AuditLogItem } from '../components/dashboard/RecentActivity';
import EmergencyOverview from '../components/dashboard/EmergencyOverview';
import FleetOverview from '../components/dashboard/FleetOverview';
import HeroSection from '../components/dashboard/HeroSection';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';

interface Stats {
  total: number;
  processed: number;
  duplicates: number;
  quarantined: number;
  workOrdersCount: number;
  pendingApprovalsCount: number;
  auditLogsCount: number;
  latestAudit?: AuditLogItem | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, ticketsRes, auditRes] = await Promise.all([
        fetch('/api/pipeline/stats'),
        fetch('/api/tickets'),
        fetch('/api/audit'),
      ]);

      if (!statsRes.ok && !ticketsRes.ok) {
        throw new Error('Could not connect to operations telemetry service.');
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData);
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditEvents(auditData);
      }
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Unable to connect to live operational data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRunPipeline = async () => {
    try {
      setRunningPipeline(true);
      setPipelineMessage(null);
      const res = await fetch('/api/pipeline/run', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPipelineMessage(
          `Pipeline executed successfully: ${data.stats.processed} tickets processed, ${data.stats.workOrdersCreated} work orders created, ${data.stats.approvalsPending} approvals pending.`
        );
        await fetchDashboardData();
      } else {
        setPipelineMessage(`Pipeline error: ${data.error}`);
      }
    } catch (err: unknown) {
      setPipelineMessage(`Pipeline failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunningPipeline(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 0. Hero Section: Animated Transit Corridors & Floating Feature Cards */}
      <HeroSection />

      {/* 1. Header & Live Controls */}
      <DashboardHeader
        onRefresh={fetchDashboardData}
        onRunPipeline={handleRunPipeline}
        loading={loading}
        runningPipeline={runningPipeline}
        pipelineMessage={pipelineMessage}
      />

      {/* Error state if complete failure */}
      {error && (
        <ErrorState
          title="Operational telemetry unavailable"
          message={error}
          onRetry={fetchDashboardData}
        />
      )}

      {/* 2. Top KPI Metric Cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <MetricsGrid stats={stats} />
      )}

      {/* 3. Real-Time Operations: Driver Safety Desk & Live Fleet Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <EmergencyOverview />
        <FleetOverview />
      </div>

      {/* 4. Analytics: Incident Trends & Severity Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Line Chart */}
        <div className="lg:col-span-7 xl:col-span-8">
          <IncidentTrend tickets={tickets} totalIncidents={stats?.total ?? 0} />
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-5 xl:col-span-4">
          <SeverityChart tickets={tickets} totalCount={stats?.total ?? 0} />
        </div>
      </div>

      {/* 5. Live Operations Logs: Recent Incidents & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Table of Incidents */}
        <div className="lg:col-span-7 xl:col-span-8">
          <RecentIncidents tickets={tickets} loading={loading} />
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-5 xl:col-span-4">
          <RecentActivity events={auditEvents} loading={loading} />
        </div>
      </div>
    </div>
  );
}
