'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
  AlertOctagon,
  Copy,
} from 'lucide-react';

interface TicketItem {
  ticketId: string;
  canonicalTicketId: string;
  createdAt: string;
  vehicle: string;
  driverId: string;
  client: string;
  issue: string;
  originHub: string;
  destination: string;
  severity: string;
  status: string;
  isQuarantined: boolean;
  isDuplicate: boolean;
  action: string | null;
  replacementVehicle: string | null;
  workOrderId: string | null;
  approvalStatus: string | null;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      searchTerm === '' ||
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.replacementVehicle && t.replacementVehicle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      t.status === statusFilter ||
      (statusFilter === 'DUPLICATE' && t.isDuplicate) ||
      (statusFilter === 'QUARANTINED' && t.isQuarantined);

    const matchesSeverity =
      severityFilter === 'ALL' || t.severity?.toUpperCase() === severityFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800">
            <AlertOctagon className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
            <AlertCircle className="w-3 h-3" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
            <Clock className="w-3 h-3" />
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-800">
            LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            {severity || 'NORMAL'}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string, isDup: boolean, isQuar: boolean) => {
    if (isQuar || status === 'QUARANTINED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800">
          <AlertOctagon className="w-3 h-3" />
          QUARANTINED
        </span>
      );
    }
    if (isDup || status === 'DUPLICATE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-yellow-950 text-yellow-400 border border-yellow-800">
          <Copy className="w-3 h-3" />
          DUPLICATE
        </span>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
          <ShieldCheck className="w-3 h-3" />
          COMPLETED
        </span>
      );
    }
    if (status === 'PROCESSING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
          <RefreshCw className="w-3 h-3 animate-spin" />
          PROCESSING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
        READY
      </span>
    );
  };

  const totalCount = tickets.length;
  const duplicateCount = tickets.filter((t) => t.isDuplicate).length;
  const quarantinedCount = tickets.filter((t) => t.isQuarantined).length;
  const validCount = totalCount - duplicateCount - quarantinedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Breakdown Tickets</span>
            <span className="text-xs font-mono font-normal bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded">
              {filteredTickets.length} records
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Operational triage stream with deterministic validation, deduplication, and replacement assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Quick Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Tickets</div>
          <div className="text-xl font-bold text-white mt-1">{totalCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Valid / Active</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{validCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-yellow-400 font-medium uppercase tracking-wider">Duplicates</div>
          <div className="text-xl font-bold text-yellow-400 mt-1">{duplicateCount}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-rose-400 font-medium uppercase tracking-wider">Quarantined</div>
          <div className="text-xl font-bold text-rose-400 mt-1">{quarantinedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket, vehicle, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY">Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="DUPLICATE">Duplicate</option>
              <option value="QUARANTINED">Quarantined</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-mono">Ticket ID</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3 font-mono">Vehicle</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 font-mono">Replacement</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Loading tickets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                    No breakdown tickets found matching filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.ticketId}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Ticket ID */}
                    <td className="px-5 py-3.5 font-mono font-semibold text-indigo-400">
                      <Link
                        href={`/tickets/${t.ticketId}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>{t.ticketId}</span>
                      </Link>
                    </td>

                    {/* Severity */}
                    <td className="px-5 py-3.5">{getSeverityBadge(t.severity)}</td>

                    {/* Vehicle */}
                    <td className="px-5 py-3.5 font-mono text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.vehicle}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-5 py-3.5 text-slate-300 font-medium">
                      {t.client}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {getStatusBadge(t.status, t.isDuplicate, t.isQuarantined)}
                    </td>

                    {/* Replacement */}
                    <td className="px-5 py-3.5 font-mono text-xs">
                      {t.replacementVehicle ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          <Truck className="w-3 h-3" />
                          {t.replacementVehicle}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                      {t.createdAt ? t.createdAt.replace('T', ' ').slice(0, 16) : '—'}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/tickets/${t.ticketId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950 px-2.5 py-1 rounded border border-indigo-800/50 transition-colors"
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
