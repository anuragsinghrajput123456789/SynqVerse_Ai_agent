'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Badge from '../ui/Badge';
import { conflictsData } from './data';

interface ContextConflictsTabProps {
  searchQuery?: string;
}

export default function ContextConflictsTab({ searchQuery = '' }: ContextConflictsTabProps) {
  const filtered = conflictsData.filter(
    (c) =>
      c.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.resolution.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {filtered.map((conf) => (
        <div
          key={conf.id}
          className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{conf.entity}</span>
            </span>
            <Badge variant="success">{conf.status}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold block">Primary Record</span>
              <span className="text-slate-300 font-mono">{conf.primaryValue}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold block">Conflicting Record</span>
              <span className="text-slate-300 font-mono">{conf.secondaryValue}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-700/40 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-indigo-200">{conf.resolution}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
