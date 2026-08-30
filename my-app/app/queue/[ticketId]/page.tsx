'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Truck,
  User,
  Building2,
  MapPin,
  Wrench,
  Shield,
  FileText,
  PlayCircle,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import { QueueTicket, Vehicle, Driver, Client } from '@/lib/types';

interface TicketDetailResponse {
  ticket: QueueTicket | null;
  vehicleContext: Vehicle | null;
  driverContext: Driver | null;
  clientContext: Client | null;
  error?: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.ticketId;

  const [data, setData] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTicket() {
      try {
        const res = await fetch(`/api/tickets/${ticketId}`);
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch ticket detail:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadTicket();
    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  const reloadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to reload ticket detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (targetStatus?: 'PROCESSING' | 'COMPLETED') => {
    setProcessing(true);
    try {
      const res = await fetch('/api/tickets/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: targetStatus }),
      });
      if (res.ok) {
        await reloadData();
      }
    } catch (err) {
      console.error('Error processing ticket:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
          Loading ticket details for {ticketId}...
        </div>
      </div>
    );
  }

  if (!data?.ticket) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center space-y-4">
        <AlertOctagon className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold">Ticket Not Found</h2>
        <p className="text-slate-400 text-sm">No ticket found with identifier &apos;{ticketId}&apos;.</p>
        <Link
          href="/queue"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-all"
        >
          Back to Breakdown Queue
        </Link>
      </div>
    );
  }

  const { ticket, vehicleContext, driverContext, clientContext } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
      {/* Header & Breadcrumb */}
      <header className="max-w-6xl mx-auto space-y-4 mb-8 pb-6 border-b border-slate-800">
        <Link
          href="/queue"
          className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Breakdown Queue
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-mono font-extrabold text-slate-100">{ticket.ticketId}</h1>
              {ticket.isQuarantined && (
                <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  QUARANTINED
                </span>
              )}
              {ticket.isDuplicate && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" />
                  DUPLICATE RECORD
                </span>
              )}
              {!ticket.isQuarantined && !ticket.isDuplicate && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    ticket.status === 'READY'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : ticket.status === 'PROCESSING'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {ticket.status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Idempotency Key: <span className="text-slate-300">{ticket.idempotencyKey}</span>
            </p>
          </div>

          {!ticket.isQuarantined && !ticket.isDuplicate && (
            <div className="flex items-center gap-2">
              {ticket.status === 'READY' && (
                <button
                  onClick={() => handleProcess('PROCESSING')}
                  disabled={processing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start Processing
                </button>
              )}
              {ticket.status === 'PROCESSING' && (
                <button
                  onClick={() => handleProcess('COMPLETED')}
                  disabled={processing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark Completed
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {/* Quarantine Banner if Quarantined */}
        {ticket.isQuarantined && (
          <div className="bg-rose-950/30 border border-rose-800/60 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertOctagon className="w-5 h-5" />
              QUARANTINED RECORD AUDIT
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-900/40">
                <span className="text-slate-500 font-semibold block mb-1">Quarantine Reason</span>
                <span className="text-rose-300 font-medium">{ticket.quarantineReason}</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-900/40">
                <span className="text-slate-500 font-semibold block mb-1">Required Action</span>
                <span className="text-amber-300 font-medium">Manual review required. Personal data redacted.</span>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Banner if Duplicate */}
        {ticket.isDuplicate && (
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-2xl p-6 shadow-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Copy className="w-5 h-5" />
              DUPLICATE OCCURRENCE DETECTED
            </div>
            <p className="text-slate-300">
              This record is a duplicate of canonical ticket <code className="text-amber-400">{ticket.duplicateOf}</code>.
              Downstream operational pipelines will not process this ticket twice to guarantee idempotency.
            </p>
          </div>
        )}

        {/* Core Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Failure & Incident */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <Wrench className="w-4 h-4" />
              Failure & Severity
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-1">Reported Failure Issue</span>
                <span className="font-semibold text-slate-200 text-sm">{ticket.issue}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Severity</span>
                  <span className="font-bold text-slate-200">{ticket.severity}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Queue Status</span>
                  <span className="font-bold text-indigo-400">{ticket.status}</span>
                </div>
              </div>

              {ticket.resolutionNote && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Resolution Note</span>
                  <span className="text-slate-400">{ticket.resolutionNote}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Vehicle Context */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
              <Truck className="w-4 h-4" />
              Resolved Vehicle
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-1">Canonical Registration</span>
                <span className="font-mono font-bold text-slate-100 text-sm">{ticket.vehicle}</span>
              </div>

              {vehicleContext ? (
                <>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-slate-500 block mb-1">Model & Specifications</span>
                    <span className="text-slate-200 font-medium">{vehicleContext.model} ({vehicleContext.year})</span>
                    <div className="text-slate-400 text-[11px] mt-1">
                      {vehicleContext.bsStage} • {vehicleContext.capacityTonnes} Tonnes • Home Hub: {vehicleContext.homeHub}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                    <span className="text-slate-500">Fleet Status</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[11px] font-semibold">
                      {vehicleContext.status}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-slate-500">
                  Vehicle context unlinked or quarantined.
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Driver & Location */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <User className="w-4 h-4" />
              Driver & Location
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-1">Assigned Driver</span>
                <div className="font-semibold text-slate-200">
                  {driverContext ? `${driverContext.name} (${driverContext.driverId})` : ticket.driverId || '—'}
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Phone: <span className="font-mono">[REDACTED]</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    DL Number: <span className="font-mono">[REDACTED]</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  Route & Location
                </span>
                <div className="font-medium text-slate-200">
                  {ticket.originHub || '—'} → {ticket.destination || '—'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Breakdown distance: {ticket.kmFromOriginHub} km from origin hub
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client & SLA Details */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            Client & SLA Contract Rules
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Client Name</span>
              <span className="font-semibold text-slate-200 text-sm">{ticket.client}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Operational SLA Window</span>
              <span className="font-bold text-indigo-400 text-sm">
                {clientContext?.operationalSlaHours ? `${clientContext.operationalSlaHours} Hours` : '48 Hours'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block mb-1">Contract SLA</span>
              <span className="text-slate-300 font-medium">
                {clientContext?.contractSlaHours ? `${clientContext.contractSlaHours} Hours` : '48 Hours'}
              </span>
            </div>
          </div>

          {clientContext?.specialRules && clientContext.specialRules.length > 0 && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 font-semibold">Enforced Client Rules:</span>
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {clientContext.specialRules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* System Provenance & Audit State */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Source Provenance & Validation Audit
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 block">Source File</span>
              <span className="text-slate-300 font-mono">{ticket.sourceFile}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Ingestion Run ID</span>
              <span className="text-slate-300 font-mono">{ticket.ingestionRunId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Created Timestamp</span>
              <span className="text-slate-300 font-mono">{ticket.createdAt}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Validation State</span>
              <span className={ticket.isQuarantined ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {ticket.isQuarantined ? 'Validation Failed (Quarantined)' : 'Validation Passed'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
