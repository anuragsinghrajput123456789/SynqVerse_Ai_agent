'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, FileCheck, Shield, AlertOctagon, ArrowLeft, RefreshCw, Database } from 'lucide-react';
import { IngestionStatus, QuarantineRecord } from '@/lib/types';

export default function PipelineStatusPage() {
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStatus() {
      setLoading(true);
      try {
        const res = await fetch('/api/context/ingest');
        const data: IngestionStatus = await res.json();
        if (isMounted) setStatus(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const triggerIngestion = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/context/ingest', { method: 'POST' });
      const data: IngestionStatus = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <Link href="/context" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Context Explorer
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Ingestion & Pipeline Status Dashboard</h1>
              <p className="text-sm text-slate-400">Part A: Unified Context Foundation Metrics & Observability</p>
            </div>
          </div>
        </div>

        <button
          onClick={triggerIngestion}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Ingesting...' : 'Run Full Pipeline Ingestion'}
        </button>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Files Discovered</span>
              <FileCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-slate-100">{status?.filesDiscovered?.length || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">CSVs, JSONs, XLSX, Emails & Transcript</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>PII Fields Masked</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400">{status?.piiFieldsMasked || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Phones, DLs, Aadhaar numbers redacted</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Conflicts Resolved</span>
              <AlertOctagon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400">{status?.conflictsDetected || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Documented precedence rule applications</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Quarantined Records</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-bold text-rose-400">{status?.quarantinedRecords?.length || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Malformed / missing required fields</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              Ingestion & Normalization Breakdown
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Fleet Master Vehicles</span>
                <span className="font-mono text-indigo-400 font-semibold">{status?.recordsIngested?.fleetMaster || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Driver Roster Records</span>
                <span className="font-mono text-indigo-400 font-semibold">{status?.recordsIngested?.drivers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Trip History Records</span>
                <span className="font-mono text-indigo-400 font-semibold">{status?.recordsIngested?.trips?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Maintenance Log Entries</span>
                <span className="font-mono text-indigo-400 font-semibold">{status?.recordsIngested?.maintenance || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Breakdown Tickets</span>
                <span className="font-mono text-indigo-400 font-semibold">{status?.recordsIngested?.tickets || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Email Threads Ingested</span>
                <span className="font-mono text-indigo-400 font-semibold">{status?.recordsIngested?.emails || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              Quarantined Records Log ({status?.quarantinedRecords?.length || 0})
            </h3>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {status?.quarantinedRecords && status.quarantinedRecords.length > 0 ? (
                status.quarantinedRecords.map((qt: QuarantineRecord, i: number) => (
                  <div key={i} className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center text-slate-200 font-semibold">
                      <span>Ticket: {qt.recordIdentifier}</span>
                      <span className="text-rose-400 font-mono">{qt.status}</span>
                    </div>
                    <p className="text-slate-300">Reason: {qt.reason}</p>
                    <p className="text-slate-500 font-mono text-[11px]">Source: &apos;{qt.source}&apos;</p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500">
                  No records quarantined.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Files Discovered & Ingested ({status?.filesDiscovered?.length || 0})
          </h3>

          <div className="flex flex-wrap gap-2">
            {status?.filesDiscovered?.map((f: string, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
                {f}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
