'use client';

import React from 'react';
import Badge from '../ui/Badge';
import { sourcesData } from './data';

interface ContextSourcesTabProps {
  searchQuery?: string;
}

export default function ContextSourcesTab({ searchQuery = '' }: ContextSourcesTabProps) {
  const filtered = sourcesData.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.authority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((src) => (
        <div
          key={src.name}
          className="p-5 rounded-3xl glass-panel border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Badge variant="cyan">{src.authority}</Badge>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-white font-mono text-sm">{src.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{src.records} authoritative rows verified</p>
          </div>
          <p className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
            Sync: {src.lastIngested}
          </p>
        </div>
      ))}
    </div>
  );
}
