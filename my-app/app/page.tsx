import Link from 'next/link';
import { Database, Shield, Layers, ArrowRight, CheckCircle2, Inbox } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full space-y-12">
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-400">
            <Shield className="w-3.5 h-3.5" />
            Synq AI Forward Deployment Challenge — Module 1: Breakdown Queue
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
            Meridian Resolve
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl">
            Production-oriented breakdown-to-resolution automation system for Meridian Freight.
            Context foundation with PII masking, deterministic entity resolution, and idempotent breakdown queue management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4 hover:border-indigo-500/60 transition-all">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl w-fit border border-indigo-500/30">
              <Inbox className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Breakdown Queue</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Operations queue managing incoming tickets, duplicate detection, quarantine isolation, and real-time state tracking.
            </p>
            <Link
              href="/queue"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Open Breakdown Queue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all">
            <div className="p-3 bg-sky-600/20 text-sky-400 rounded-xl w-fit border border-sky-500/30">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Context Explorer</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Search vehicles, drivers, and clients across all resolved entities with PII masking and conflict precedence audits.
            </p>
            <Link
              href="/context"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              Open Context Explorer
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all">
            <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl w-fit border border-emerald-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Pipeline Status</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitor files discovered, records ingested, entities resolved, PII fields masked, and quarantined broken records.
            </p>
            <Link
              href="/context/status"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              View Pipeline Metrics
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Module 1 Breakdown Queue Guarantees</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Deterministic Idempotency
              </span>
              <p className="text-slate-400">Stable <code className="text-indigo-300 font-mono">BREAKDOWN:&#123;id&#125;</code> keys prevent duplicate ticket generation and repeated downstream processing.</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Quarantine Isolation
              </span>
              <p className="text-slate-400">Malformed or missing critical fields are safely quarantined with sanitized reasons without crashing ingestion.</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                PII Masking Boundary
              </span>
              <p className="text-slate-400">Driver phone numbers, license numbers, and Aadhaar identifiers are strictly redacted into [REDACTED].</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-600 mt-12">
        Meridian Resolve — Built for Synq AI Forward Deployment Challenge
      </footer>
    </div>
  );
}
