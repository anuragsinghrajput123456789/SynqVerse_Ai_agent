'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
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

  const fetchAuditLogs = useCallback(async () => {
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
  }, [ticketFilter, eventTypeFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

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
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PII_MASKED':
      case 'ENTITY_RESOLVED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'RULE_EVALUATED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'VEHICLE_SELECTED':
      case 'WORK_ORDER_CREATED':
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'VEHICLE_REJECTED':
      case 'TICKET_QUARANTINED':
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'APPROVAL_REQUESTED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  const uniqueTickets = Array.from(new Set(events.map((e) => e.ticketId)));
  const uniqueEventTypes = Array.from(new Set(events.map((e) => e.eventType)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Audit Trail</span>
            <span className="text-xs font-mono font-normal bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2.5 py-0.5 rounded-full">
              SHA-256 Verified
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Forensic, tamper-evident ledger for every rule evaluation, candidate rejection, and authoritative citation.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-3xl glass-panel border border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search forensic logs, actor, rule ID..."
            className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full"
          />
        </div>

        <select
          value={ticketFilter}
          onChange={(e) => setTicketFilter(e.target.value)}
          aria-label="Filter by ticket"
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="">All Tickets ({uniqueTickets.length})</option>
          {uniqueTickets.map((t) => (
            <option key={t} value={t}>
              Ticket {t}
            </option>
          ))}
        </select>

        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          aria-label="Filter by event type"
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="ALL">All Event Types ({uniqueEventTypes.length})</option>
          {uniqueEventTypes.map((et) => (
            <option key={et} value={et}>
              {et}
            </option>
          ))}
        </select>
      </div>

      {/* Events Timeline List */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-800/60">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No audit events found matching filters.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isExpanded = expandedEventId === evt.eventId;
              return (
                <div key={evt.eventId} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div
                    onClick={() => toggleExpand(evt.eventId)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getEventTypeBadge(
                          evt.eventType
                        )}`}
                      >
                        {evt.eventType}
                      </span>
                      <Link
                        href={`/tickets/${evt.ticketId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-mono font-bold text-indigo-400 hover:underline"
                      >
                        {evt.ticketId}
                      </Link>
                      <span className="text-xs text-slate-300 font-medium truncate max-w-xs sm:max-w-md">
                        {evt.reason}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono self-end sm:self-auto">
                      <span className="text-slate-500">{evt.actor}</span>
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3 text-xs animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 font-mono">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Event UUID</span>
                          <span className="text-slate-200">{evt.eventId}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Timestamp</span>
                          <span className="text-slate-200">{evt.timestamp}</span>
                        </div>
                        {evt.ruleId && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">Evaluated Rule</span>
                            <span className="text-purple-400">{evt.ruleId}</span>
                          </div>
                        )}
                        {evt.sourceReferences && evt.sourceReferences.length > 0 && (
                          <div>
                            <span className="text-[10px] text-slate-500 block">Authoritative Citations</span>
                            <span className="text-cyan-300">{evt.sourceReferences.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {evt.safeMetadata && Object.keys(evt.safeMetadata).length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block mb-1">
                            Forensic Metadata:
                          </span>
                          <pre className="p-3 rounded-xl bg-slate-950 text-slate-300 text-[11px] overflow-x-auto border border-slate-800 font-mono">
                            {JSON.stringify(evt.safeMetadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
