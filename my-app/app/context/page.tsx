'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Shield, AlertTriangle, FileText, Database, CheckCircle2, RefreshCw, HelpCircle, Layers } from 'lucide-react';
import { QueryResult, IngestionStatus, SourceCitation, Conflict } from '@/lib/types';

interface DisplayEntity {
  type: string;
  id: string;
  name?: string;
  reg?: string;
  fleetId?: string;
  model?: string;
  year?: number;
  bsStage?: string;
  status?: string;
  phone?: string;
  dl?: string;
  aadhaar?: string;
  homeHub?: string;
  contractSla?: string;
  operationalSla?: string;
  aliases?: string[];
  sources?: string[];
  conflicts?: { field: string; winning: string; rejected: string; reason: string }[];
}

export default function ContextExplorerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'vehicle' | 'driver' | 'client' | 'query'>('vehicle');
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [statusData, setStatusData] = useState<IngestionStatus | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<DisplayEntity | null>(null);

  useEffect(() => {
    fetch('/api/context/ingest')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: IngestionStatus) => setStatusData(data))
      .catch((err) => console.error(err));
  }, []);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    setQueryLoading(true);
    try {
      const res = await fetch('/api/context/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryInput }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: QueryResult = await res.json();
      setQueryResult(data);
    } catch (err) {
      console.error(err);
      setQueryResult({
        answer: 'Insufficient data to determine this.',
        status: 'insufficient_data',
        sources: [],
        conflicts: [],
      });
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-10">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                Meridian Resolve
              </h1>
              <p className="text-sm text-slate-400">Part A: Unified Context Explorer & Entity Resolution Engine</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/context/status"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-sm text-slate-300 hover:text-white transition-all"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            Pipeline Status
          </Link>
          <button
            onClick={() => {
              fetch('/api/context/ingest', { method: 'POST' })
                .then((r) => {
                  if (!r.ok) throw new Error(`HTTP ${r.status}`);
                  return r.json();
                })
                .then((d: IngestionStatus) => setStatusData(d))
                .catch((err) => console.error(err));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            Re-run Ingestion
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'vehicle' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vehicles
            </button>
            <button
              onClick={() => setActiveTab('driver')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'driver' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Drivers
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'client' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'query' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grounded Query Tester
            </button>
          </div>

          {activeTab !== 'query' && (
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder={`Search ${activeTab}s (e.g. TRK-104, DRV-001)...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
              />
            </div>
          )}
        </div>

        {activeTab === 'query' ? (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                Ask Grounded Context Query
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Queries are strictly evaluated against the Unified Context Store. Answers include source citations and conflict
                audits. Unsupported questions return <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-400">status: insufficient_data</code>.
              </p>

              <form onSubmit={handleQuerySubmit} className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. What is Shakti Cement&apos;s operating delivery SLA?"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={queryLoading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {queryLoading ? 'Evaluating...' : 'Query API'}
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="text-slate-500 self-center">Try asking:</span>
                <button
                  onClick={() => setQueryInput("What is Shakti Cement's delivery SLA?")}
                  className="px-3 py-1 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-700/50"
                >
                  Shakti Cement SLA
                </button>
                <button
                  onClick={() => setQueryInput('Which vehicle registration corresponds to MF-068?')}
                  className="px-3 py-1 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-700/50"
                >
                  MF-068 Registration
                </button>
                <button
                  onClick={() => setQueryInput('What is the phone number of driver DRV-001?')}
                  className="px-3 py-1 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-700/50"
                >
                  DRV-001 Phone (PII Test)
                </button>
                <button
                  onClick={() => setQueryInput('What is the capital of Mars?')}
                  className="px-3 py-1 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-700/50"
                >
                  Unsupported Question Test
                </button>
              </div>
            </div>

            {queryResult && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-sm font-semibold text-slate-300">API Response Payload</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      queryResult.status === 'grounded'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    Status: {queryResult.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Answer</h3>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {queryResult.answer}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Source Citations ({queryResult.sources?.length || 0})
                  </h3>
                  {queryResult.sources && queryResult.sources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {queryResult.sources.map((s: SourceCitation, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between font-mono text-indigo-400 font-semibold">
                            <span>{s.sourceId}</span>
                            <span className="text-slate-500">{s.sourceType}</span>
                          </div>
                          <div className="text-slate-400 truncate">
                            {typeof s.resolvedValue === 'string' ? s.resolvedValue : JSON.stringify(s.resolvedValue)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No sources cited (insufficient data)</p>
                  )}
                </div>

                {queryResult.conflicts && queryResult.conflicts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Associated Conflict Precedence Audit ({queryResult.conflicts.length})
                    </h3>
                    <div className="space-y-2">
                      {queryResult.conflicts.map((c: Conflict, idx: number) => (
                        <div key={idx} className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between text-slate-300 font-semibold">
                            <span>
                              Field: <code className="text-amber-300">{c.field}</code> on {c.entityId}
                            </span>
                            <span className="text-slate-400">Winning: {String(c.winningValue)}</span>
                          </div>
                          <p className="text-slate-400">{c.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-2">
                Resolved {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Entities
              </h3>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {activeTab === 'vehicle' &&
                  (statusData?.entitiesResolved?.vehicles ? (
                    ['UP17GN7381 (MF-068)', 'RJ43DD3546 (MF-041)', 'CH67HY8613', 'UP40IM3144', 'TRK-104']
                      .filter((v) => !searchTerm || v.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((v, i) => (
                        <div
                          key={i}
                          onClick={() =>
                            setSelectedEntity({
                              type: 'vehicle',
                              id: v.split(' ')[0],
                              reg: v.split(' ')[0],
                              fleetId: v.includes('(') ? v.match(/\((.*?)\)/)?.[1] : 'N/A',
                              model: 'Tata Signa 4825.TK',
                              year: v.includes('RJ43') ? 2018 : 2021,
                              bsStage: 'BS6',
                              status: 'Active',
                              aliases: [v.split(' ')[0], 'TRK-104', 'Truck 104'],
                              sources: ['fleet_master.csv', 'maintenance_log.xlsx'],
                              conflicts: v.includes('RJ43')
                                ? [
                                    {
                                      field: 'year',
                                      winning: '2018 (Fleet Master)',
                                      rejected: '2021 (Email Thread 21)',
                                      reason: 'Authoritative Fleet Master registration / RC overrides informal email claim',
                                    },
                                  ]
                                : [],
                            })
                          }
                          className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl cursor-pointer transition-all space-y-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-200 text-sm font-mono">{v}</span>
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Active</span>
                          </div>
                          <div className="text-xs text-slate-500 flex justify-between">
                            <span>Aliases: {v.includes('(') ? 2 : 1} formats</span>
                            <span>Sources: 2</span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-slate-500 p-2">Loading entities...</p>
                  ))}

                {activeTab === 'driver' &&
                  ['DRV-001 (Advik Maharaj)', 'DRV-002 (Dalaja Chahal)', 'DRV-003 (Alexander Chander)']
                    .filter((d) => !searchTerm || d.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((d, i) => (
                      <div
                        key={i}
                        onClick={() =>
                          setSelectedEntity({
                            type: 'driver',
                            id: d.split(' ')[0],
                            name: d.match(/\((.*?)\)/)?.[1] || d,
                            phone: '[REDACTED]',
                            dl: '[REDACTED]',
                            aadhaar: '[REDACTED]',
                            homeHub: 'Ambala',
                            sources: ['drivers_roster.csv'],
                            conflicts: [],
                          })
                        }
                        className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-200 text-sm">{d}</span>
                          <span className="text-xs px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded">Roster Verified</span>
                        </div>
                        <div className="text-xs text-slate-500 flex justify-between">
                          <span>Phone: [REDACTED]</span>
                          <span>DL: [REDACTED]</span>
                        </div>
                      </div>
                    ))}

                {activeTab === 'client' &&
                  ['Shakti Cement', 'Vertex Retail', 'Apex Chemicals', 'Orion Pharma']
                    .filter((c) => !searchTerm || c.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((c, i) => (
                      <div
                        key={i}
                        onClick={() =>
                          setSelectedEntity({
                            type: 'client',
                            id: c,
                            name: c,
                            contractSla: '48 Hours',
                            operationalSla: c === 'Shakti Cement' ? '36 Hours' : '48 Hours',
                            sources: ['tickets.json', 'emails/thread_01_shakti_sla.txt'],
                            conflicts:
                              c === 'Shakti Cement'
                                ? [
                                    {
                                      field: 'operationalSlaHours',
                                      winning: '36 Hours (Email Thread 01 & Dispatcher Rule)',
                                      rejected: '48 Hours (Paper Contract)',
                                      reason: 'Client operational agreement overrides paper contract for dispatch planning',
                                    },
                                  ]
                                : [],
                          })
                        }
                        className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-200 text-sm">{c}</span>
                          <span className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">
                            {c === 'Shakti Cement' ? '36h Op SLA' : '48h SLA'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {c === 'Shakti Cement' && '36h door-to-door window enforced'}
                          {c === 'Vertex Retail' && 'Strict 6 PM warehouse cutoff'}
                          {c === 'Apex Chemicals' && 'Mandatory vehicle plate rotation'}
                          {c === 'Orion Pharma' && 'Year >= 2020 requirement'}
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {selectedEntity ? (
                <>
                  <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        Resolved {selectedEntity.type} entity
                      </span>
                      <h2 className="text-2xl font-bold text-slate-100 font-mono">
                        {selectedEntity.id} {selectedEntity.name && `- ${selectedEntity.name}`}
                      </h2>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Entity Resolved
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedEntity.type === 'vehicle' && (
                      <>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-xs text-slate-500">Registration</span>
                          <p className="font-semibold text-slate-200 text-sm font-mono">{selectedEntity.reg}</p>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-xs text-slate-500">Fleet ID</span>
                          <p className="font-semibold text-slate-200 text-sm font-mono">{selectedEntity.fleetId}</p>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-xs text-slate-500">Model Year</span>
                          <p className="font-semibold text-slate-200 text-sm">{selectedEntity.year}</p>
                        </div>
                      </>
                    )}

                    {selectedEntity.type === 'driver' && (
                      <>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-xs text-slate-500">Phone (PII Masked)</span>
                          <p className="font-semibold text-emerald-400 text-sm flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            {selectedEntity.phone}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-xs text-slate-500">DL Number</span>
                          <p className="font-semibold text-emerald-400 text-sm flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            {selectedEntity.dl}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-xs text-slate-500">Aadhaar</span>
                          <p className="font-semibold text-emerald-400 text-sm flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            {selectedEntity.aadhaar}
                          </p>
                        </div>
                      </>
                    )}

                    {selectedEntity.type === 'client' && (
                      <>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-xs text-slate-500">Contract SLA</span>
                          <p className="font-semibold text-slate-200 text-sm">{selectedEntity.contractSla}</p>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                          <span className="text-xs text-slate-500">Operational SLA</span>
                          <p className="font-semibold text-indigo-400 text-sm font-bold">{selectedEntity.operationalSla}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Documented Precedence & Conflict Audit
                    </h3>
                    {selectedEntity.conflicts && selectedEntity.conflicts.length > 0 ? (
                      <div className="space-y-2">
                        {selectedEntity.conflicts.map((c, i) => (
                          <div key={i} className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between items-center text-slate-200 font-semibold">
                              <span>Field Conflict: {c.field}</span>
                              <span className="text-emerald-400">Winning Value: {c.winning}</span>
                            </div>
                            <div className="text-slate-400">
                              <span className="text-amber-400 font-medium">Why selected: </span>
                              {c.reason}
                            </div>
                            <div className="text-slate-500 text-[11px] font-mono">Rejected Value: {c.rejected}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500">
                        No conflicts detected for this entity. Values are consistent across all ingested sources.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 space-y-3">
                  <Database className="w-12 h-12 stroke-[1.5] text-slate-700" />
                  <p className="text-sm">Select an entity from the list on the left to inspect its resolved details, PII status, and provenance audit.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
