'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  CheckCircle2,
  Copy,
  AlertTriangle,
  FileCheck2,
  Clock,
  Play,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface Stats {
  total: number;
  processed: number;
  duplicates: number;
  quarantined: number;
  workOrdersCount: number;
  pendingApprovalsCount: number;
  auditLogsCount: number;
  latestAudit: {
    eventId: string;
    ticketId: string;
    eventType: string;
    timestamp: string;
    actor: string;
    reason: string;
  } | null;
}

interface TicketSummary {
  ticketId: string;
  vehicle: string;
  client: string;
  issue: string;
  severity: string;
  status: string;
  action: string | null;
  replacementVehicle: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([
        fetch('/api/pipeline/stats'),
        fetch('/api/tickets'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setRecentTickets(ticketsData.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border border-red-800';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-950/80 text-blue-400 border border-blue-800';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-950 text-emerald-400 border border-emerald-800';
      case 'QUARANTINED':
        return 'bg-rose-950 text-rose-400 border border-rose-800';
      case 'DUPLICATE':
        return 'bg-yellow-950 text-yellow-400 border border-yellow-800';
      case 'PROCESSING':
        return 'bg-indigo-950 text-indigo-400 border border-indigo-800';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Grafity Operations Dashboard</span>
            <span className="text-xs font-mono font-normal bg-indigo-900/50 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded">
              v1.0
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time breakdown triage, deterministic decisioning, candidate ranking & human dispatch oversight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleRunPipeline}
            disabled={runningPipeline}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {runningPipeline ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Full Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Run Notification Alert */}
      {pipelineMessage && (
        <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-700/60 text-indigo-200 text-sm flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="flex-1">{pipelineMessage}</div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Tickets */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Tickets</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats?.total ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-0.5">Ingested from stream</div>
          </div>
        </div>

        {/* Processed Valid */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium uppercase tracking-wider">Processed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400">{stats?.processed ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-0.5">Valid & dispatched</div>
          </div>
        </div>

        {/* Duplicates */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-yellow-400">
            <span className="text-xs font-medium uppercase tracking-wider">Duplicates</span>
            <Copy className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-yellow-400">{stats?.duplicates ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-0.5">Safely deduplicated</div>
          </div>
        </div>

        {/* Quarantined */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-medium uppercase tracking-wider">Quarantined</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400">{stats?.quarantined ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-0.5">Malformed / isolated</div>
          </div>
        </div>

        {/* Work Orders */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-xs font-medium uppercase tracking-wider">Work Orders</span>
            <FileCheck2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-400">{stats?.workOrdersCount ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-0.5">Exactly-once created</div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-medium uppercase tracking-wider">Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-400">{stats?.pendingApprovalsCount ?? '—'}</div>
            <div className="text-xs text-slate-500 mt-0.5">Pending dispatcher</div>
          </div>
        </div>
      </div>

      {/* Latest Pipeline Run Summary */}
      {stats?.latestAudit && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950 text-indigo-400 rounded-lg border border-indigo-800/50">
              <ActivityIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">Latest Pipeline Lifecycle Activity</div>
              <div className="text-sm font-medium text-slate-200 mt-0.5">
                Ticket <span className="font-mono text-indigo-300">{stats.latestAudit.ticketId}</span>: {stats.latestAudit.eventType}
                <span className="text-xs text-slate-400 ml-2 font-normal">({stats.latestAudit.reason})</span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono hidden md:block">
            {new Date(stats.latestAudit.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Recent Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Breakdown Incidents</h2>
            <p className="text-xs text-slate-400">Click any ticket to inspect full reasoning, candidate ranking, and audit timeline.</p>
          </div>
          <Link
            href="/tickets"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-mono">Ticket ID</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3 font-mono">Vehicle</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3 font-mono">Replacement</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No tickets in queue. Click "Run Full Pipeline" to ingest and evaluate.
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => (
                  <tr key={t.ticketId} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-indigo-400">{t.ticketId}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSeverityBadge(t.severity)}`}>
                        {t.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-200">{t.vehicle}</td>
                    <td className="px-5 py-3.5 text-slate-300">{t.client}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-300 font-mono">
                      {t.action ? t.action.replace('_', ' ') : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">
                      {t.replacementVehicle ? (
                        <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          {t.replacementVehicle}
                        </span>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/tickets/${t.ticketId}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950 px-2.5 py-1 rounded border border-indigo-800/50 transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
