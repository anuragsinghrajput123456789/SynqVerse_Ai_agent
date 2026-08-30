'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Inbox,
  CheckCircle2,
  Copy,
  AlertOctagon,
  Clock,
  PlayCircle,
  CheckCheck,
  Search,
  RefreshCw,
  Eye,
  ArrowRight,
  Database,
  Shield,
  Layers,
} from 'lucide-react';
import { QueueTicket, QueueStats } from '@/lib/types';

export default function BreakdownQueuePage() {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadQueue() {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (severityFilter !== 'ALL') params.set('severity', severityFilter);

        const res = await fetch(`/api/tickets?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setTickets(data.tickets || []);
          setStats(data.stats || null);
        }
      } catch (err) {
        console.error('Failed to load breakdown queue:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadQueue();
    return () => {
      isMounted = false;
    };
  }, [searchTerm, statusFilter, severityFilter]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (severityFilter !== 'ALL') params.set('severity', severityFilter);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTickets(data.tickets || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to refresh breakdown queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tickets/ingest', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refreshData();
    } catch (err) {
      console.error('Ingestion failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTicket = async (ticketId: string) => {
    setProcessingId(ticketId);
    try {
      const res = await fetch('/api/tickets/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refreshData();
    } catch (err) {
      console.error('Process error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            READY
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <PlayCircle className="w-3.5 h-3.5" />
            PROCESSING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-700">
            <CheckCheck className="w-3.5 h-3.5" />
            COMPLETED
          </span>
        );
      case 'DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Copy className="w-3.5 h-3.5" />
            DUPLICATE
          </span>
        );
      case 'QUARANTINED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertOctagon className="w-3.5 h-3.5" />
            QUARANTINED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-400 border border-red-800/60">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-300 border border-rose-800/60">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950 text-amber-300 border border-amber-800/60">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] text-slate-400">{severity}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 rounded-full text-[11px] font-semibold text-indigo-400 mb-1">
                Module 1: Breakdown Queue Management
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                BREAKDOWN QUEUE
              </h1>
              <p className="text-sm text-slate-400">
                Idempotent ticket ingestion, validation, duplicate isolation, and real-time operational state tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/context"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all"
          >
            <Database className="w-4 h-4 text-indigo-400" />
            Context Explorer
          </Link>
          <Link
            href="/context/status"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            Pipeline Metrics
          </Link>
          <button
            onClick={handleIngest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-run Ingestion
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Tickets</span>
            <div className="text-2xl font-bold text-slate-100 mt-1">{stats?.total || 0}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              Valid
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            </span>
            <div className="text-2xl font-bold text-sky-400 mt-1">{stats?.valid || 0}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              Duplicates
              <Copy className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats?.duplicates || 0}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              Quarantined
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            </span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{stats?.quarantined || 0}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              Ready
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats?.ready || 0}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              Processing
              <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
            </span>
            <div className="text-2xl font-bold text-indigo-400 mt-1">{stats?.processing || 0}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md">
            <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
              Completed
              <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
            </span>
            <div className="text-2xl font-bold text-slate-300 mt-1">{stats?.completed || 0}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ticket ID, vehicle, client, issue, hub..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="READY">READY</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DUPLICATE">DUPLICATE</option>
                <option value="QUARANTINED">QUARANTINED</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <button
              onClick={refreshData}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4">Ticket ID</th>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">Location / Route</th>
                  <th className="px-5 py-4">Client</th>
                  <th className="px-5 py-4">Failure Description</th>
                  <th className="px-5 py-4">Severity</th>
                  <th className="px-5 py-4">Queue Status</th>
                  <th className="px-5 py-4">Created At</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-500 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        Loading breakdown tickets...
                      </div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-500 text-sm">
                      No breakdown tickets found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.ticketId} className="hover:bg-slate-800/40 transition-all">
                      {/* Ticket ID */}
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-indigo-300">
                        <Link href={`/queue/${t.canonicalTicketId || t.ticketId}`} className="hover:underline flex items-center gap-1.5">
                          {t.ticketId}
                          {t.isDuplicate && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded">DUP</span>
                          )}
                          {t.isQuarantined && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-400 rounded">ERR</span>
                          )}
                        </Link>
                      </td>

                      {/* Vehicle */}
                      <td className="px-5 py-3.5 font-mono text-xs">
                        {t.isQuarantined ? (
                          <span className="text-rose-400">{t.rawVehicle || '[MISSING]'}</span>
                        ) : (
                          <span className="text-slate-200">{t.vehicle}</span>
                        )}
                      </td>

                      {/* Location / Route */}
                      <td className="px-5 py-3.5 text-xs text-slate-300">
                        <div className="flex items-center gap-1 font-medium">
                          <span>{t.originHub || '—'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span>{t.destination || '—'}</span>
                        </div>
                        {t.kmFromOriginHub > 0 && (
                          <span className="text-[11px] text-slate-500">{t.kmFromOriginHub} km from hub</span>
                        )}
                      </td>

                      {/* Client */}
                      <td className="px-5 py-3.5 text-xs text-slate-300 font-medium">
                        {t.client || '—'}
                      </td>

                      {/* Failure Issue */}
                      <td className="px-5 py-3.5 text-xs text-slate-300 max-w-xs truncate" title={t.issue}>
                        {t.isQuarantined ? (
                          <span className="text-rose-400 italic">{t.quarantineReason || t.issue}</span>
                        ) : (
                          <span>{t.issue}</span>
                        )}
                      </td>

                      {/* Severity */}
                      <td className="px-5 py-3.5">{getSeverityBadge(t.severity)}</td>

                      {/* Status */}
                      <td className="px-5 py-3.5">{getStatusBadge(t.status)}</td>

                      {/* Created */}
                      <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                        {t.createdAt ? t.createdAt.replace('T', ' ').slice(0, 16) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <Link
                            href={`/queue/${t.canonicalTicketId || t.ticketId}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-all"
                            title="View Ticket Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          {!t.isQuarantined && !t.isDuplicate && t.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleProcessTicket(t.ticketId)}
                              disabled={processingId === t.ticketId}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 flex items-center gap-1 shadow-md shadow-indigo-600/20"
                            >
                              {processingId === t.ticketId ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : t.status === 'READY' ? (
                                'Process'
                              ) : (
                                'Complete'
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Quarantine Footer Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">PII Boundary Enforced: </span>
              All driver contact details and government IDs are masked as <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">[REDACTED]</code>.
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Idempotency Key Format: <code>BREAKDOWN:&#123;canonicalTicketId&#125;</code>
          </div>
        </div>
      </main>
    </div>
  );
}
