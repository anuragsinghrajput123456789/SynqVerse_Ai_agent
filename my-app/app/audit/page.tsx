'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Filter,
  Search,
  RefreshCw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AuditEvent } from '@/lib/audit';

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketFilter, setTicketFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      let url = '/api/audit';
      const params = new URLSearchParams();
      if (ticketFilter.trim()) params.append('ticketId', ticketFilter.trim());
      if (eventTypeFilter !== 'ALL') params.append('eventType', eventTypeFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [ticketFilter, eventTypeFilter]);

  const filteredEvents = events.filter((e) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      e.eventId.toLowerCase().includes(q) ||
      e.ticketId.toLowerCase().includes(q) ||
      e.eventType.toLowerCase().includes(q) ||
      e.actor.toLowerCase().includes(q) ||
      e.reason.toLowerCase().includes(q) ||
      (e.ruleId && e.ruleId.toLowerCase().includes(q))
    );
  });

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'TICKET_RECEIVED':
      case 'TICKET_VALIDATED':
        return 'bg-blue-950/80 text-blue-300 border border-blue-800';
      case 'PII_MASKED':
      case 'ENTITY_RESOLVED':
        return 'bg-indigo-950/80 text-indigo-300 border border-indigo-800';
      case 'RULE_EVALUATED':
        return 'bg-purple-950/80 text-purple-300 border border-purple-800';
      case 'VEHICLE_SELECTED':
      case 'WORK_ORDER_CREATED':
        return 'bg-emerald-950/80 text-emerald-300 border border-emerald-800';
      case 'VEHICLE_REJECTED':
      case 'TICKET_QUARANTINED':
      case 'REJECTED':
        return 'bg-rose-950/80 text-rose-300 border border-rose-800';
      case 'APPROVAL_REQUESTED':
        return 'bg-amber-950/80 text-amber-300 border border-amber-800';
      case 'APPROVED':
        return 'bg-emerald-900 text-emerald-200 border border-emerald-600';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  const uniqueTickets = Array.from(new Set(events.map((e) => e.ticketId)));
  const uniqueEventTypes = Array.from(new Set(events.map((e) => e.eventType)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Operational Audit Trail</span>
            <span className="text-xs font-mono font-normal bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded">
              {filteredEvents.length} Events Logged
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable, append-only log of every lifecycle step, rule evaluation, PII redaction, and human approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Trail
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Events</div>
          <div className="text-xl font-bold text-white mt-1">{events.length}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-indigo-400 font-medium uppercase tracking-wider">Tracked Tickets</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">{uniqueTickets.length}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Security Invariants</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">100% PII Masked</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-amber-400 font-medium uppercase tracking-wider">Event Types</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{uniqueEventTypes.length}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reasons, rule IDs, actors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Ticket ID Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Ticket:</span>
            <input
              type="text"
              placeholder="e.g. TKT-0001"
              value={ticketFilter}
              onChange={(e) => setTicketFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 w-32 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Event Type:</span>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Event Types</option>
              <option value="TICKET_RECEIVED">TICKET_RECEIVED</option>
              <option value="TICKET_VALIDATED">TICKET_VALIDATED</option>
              <option value="TICKET_QUARANTINED">TICKET_QUARANTINED</option>
              <option value="PII_MASKED">PII_MASKED</option>
              <option value="ENTITY_RESOLVED">ENTITY_RESOLVED</option>
              <option value="RULE_EVALUATED">RULE_EVALUATED</option>
              <option value="VEHICLE_REJECTED">VEHICLE_REJECTED</option>
              <option value="VEHICLE_SELECTED">VEHICLE_SELECTED</option>
              <option value="WORK_ORDER_CREATED">WORK_ORDER_CREATED</option>
              <option value="MESSAGE_DRAFTED">MESSAGE_DRAFTED</option>
              <option value="APPROVAL_REQUESTED">APPROVAL_REQUESTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 font-mono">Timestamp</th>
                <th className="px-5 py-3 font-mono">Ticket ID</th>
                <th className="px-5 py-3">Event Type</th>
                <th className="px-5 py-3 font-mono">Actor</th>
                <th className="px-5 py-3">Reason / Operation</th>
                <th className="px-5 py-3 font-mono">Rule ID</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Loading audit stream...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const isExpanded = expandedEventId === ev.eventId;
                  return (
                    <React.Fragment key={ev.eventId}>
                      <tr className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-slate-400 whitespace-nowrap">
                          {ev.timestamp ? ev.timestamp.replace('T', ' ').slice(0, 19) : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-semibold text-indigo-400">
                          <Link
                            href={`/tickets/${ev.ticketId}`}
                            className="hover:underline flex items-center gap-1"
                          >
                            <span>{ev.ticketId}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getEventTypeBadge(ev.eventType)}`}>
                            {ev.eventType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-300">{ev.actor}</td>
                        <td className="px-5 py-3.5 text-slate-200 max-w-xs truncate" title={ev.reason}>
                          {ev.reason}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs">
                          {ev.ruleId ? (
                            <span className="text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                              {ev.ruleId}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => toggleExpand(ev.eventId)}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 bg-slate-950 px-2 py-1 rounded border border-slate-800"
                          >
                            <span>Inspect</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable row for metadata & source references */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                              <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                                <span className="font-mono text-indigo-400 font-bold">Event ID: {ev.eventId}</span>
                                <span className="font-mono text-slate-500">
                                  Safe Metadata Audit Log
                                </span>
                              </div>

                              <div className="space-y-1 text-xs">
                                <span className="text-slate-400 font-medium block">Full Event Reason:</span>
                                <p className="text-slate-200">{ev.reason}</p>
                              </div>

                              {ev.sourceReferences && ev.sourceReferences.length > 0 && (
                                <div className="space-y-1 text-xs pt-2 border-t border-slate-800">
                                  <span className="text-slate-400 font-medium block">Source References:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {ev.sourceReferences.map((ref, rIdx) => (
                                      <span
                                        key={rIdx}
                                        className="font-mono text-[11px] bg-slate-950 text-indigo-300 px-2 py-0.5 rounded border border-slate-800"
                                      >
                                        {ref}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {ev.safeMetadata && Object.keys(ev.safeMetadata).length > 0 && (
                                <div className="space-y-1 text-xs pt-2 border-t border-slate-800">
                                  <span className="text-slate-400 font-medium block">Metadata:</span>
                                  <pre className="p-3 bg-slate-950 rounded border border-slate-800/80 text-[11px] text-slate-300 font-mono overflow-x-auto">
                                    {JSON.stringify(ev.safeMetadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
