import Link from 'next/link';
import { Database, Shield, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full space-y-12">
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-400">
            <Shield className="w-3.5 h-3.5" />
            Synq AI Forward Deployment Challenge — Part A
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
            Meridian Resolve
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl">
            Production-oriented breakdown-to-resolution automation system for Meridian Freight.
            Context foundation with PII masking, deterministic entity resolution, and grounded citation query engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl w-fit border border-indigo-500/30">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Context Explorer</h2>
            <p className="text-sm text-slate-400">
              Search vehicles, drivers, and clients across all resolved entities. View source records, masked PII, and documented conflict precedence audits.
            </p>
            <Link
              href="/context"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Open Context Explorer
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all">
            <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl w-fit border border-emerald-500/30">
              <Layers className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Pipeline Status Dashboard</h2>
            <p className="text-sm text-slate-400">
              Monitor files discovered, records ingested, entities resolved, PII fields masked, and quarantined broken records.
            </p>
            <Link
              href="/context/status"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-medium rounded-xl border border-slate-700 transition-all"
            >
              View Pipeline Metrics
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Part A Architectural Principles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                PII Ingestion Gate
              </span>
              <p className="text-slate-400">Phones, DLs, and Aadhaar numbers masked into [REDACTED] before storage or Gemini access.</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Deterministic Resolution
              </span>
              <p className="text-slate-400">Normalizes vehicle registration aliases (UP17GN7381, TRK-104, MF-068) without using LLMs.</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Zero Hallucinations
              </span>
              <p className="text-slate-400">Queries require grounded citations; unsupported questions return status: insufficient_data.</p>
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
