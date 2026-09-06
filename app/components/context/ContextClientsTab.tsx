'use client';

import React from 'react';
import Badge from '../ui/Badge';
import { clientsData } from './data';

interface ContextClientsTabProps {
  searchQuery?: string;
}

export default function ContextClientsTab({ searchQuery = '' }: ContextClientsTabProps) {
  const filtered = clientsData.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contractId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#0b1020] text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800/80">
          <tr>
            <th className="px-6 py-4 font-mono">Client ID</th>
            <th className="px-6 py-4">Corporate Client</th>
            <th className="px-6 py-4">Priority Tier</th>
            <th className="px-6 py-4">SLA Turnaround</th>
            <th className="px-6 py-4">BS6 Requirement</th>
            <th className="px-6 py-4">Contract ID</th>
            <th className="px-6 py-4">Authority</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-6 py-4 font-mono font-bold text-indigo-400">{c.id}</td>
              <td className="px-6 py-4 text-white font-semibold">{c.name}</td>
              <td className="px-6 py-4">
                <Badge variant="purple">{c.priority}</Badge>
              </td>
              <td className="px-6 py-4 font-mono text-cyan-300">{c.slaTurnaroundMin} mins</td>
              <td className="px-6 py-4 text-xs">
                {c.bs6Mandatory ? (
                  <span className="text-emerald-400 font-semibold">Strict BS6 Only</span>
                ) : (
                  <span className="text-slate-400">Standard Fleet</span>
                )}
              </td>
              <td className="px-6 py-4 font-mono text-slate-400">{c.contractId}</td>
              <td className="px-6 py-4">
                <Badge variant="cyan">{c.authority}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
