'use client';

import React from 'react';
import Badge from '../ui/Badge';
import { driversData } from './data';

interface ContextDriversTabProps {
  searchQuery?: string;
}

export default function ContextDriversTab({ searchQuery = '' }: ContextDriversTabProps) {
  const filtered = driversData.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#0b1020] text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800/80">
          <tr>
            <th className="px-6 py-4 font-mono">Driver ID</th>
            <th className="px-6 py-4">Full Name</th>
            <th className="px-6 py-4">Phone (PII Masked)</th>
            <th className="px-6 py-4">License Mask</th>
            <th className="px-6 py-4">Assigned Vehicle</th>
            <th className="px-6 py-4">Source Provenance</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {filtered.map((d) => (
            <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-6 py-4 font-mono font-bold text-indigo-400">{d.id}</td>
              <td className="px-6 py-4 text-white font-medium">{d.name}</td>
              <td className="px-6 py-4 text-xs font-mono text-emerald-400">{d.phone}</td>
              <td className="px-6 py-4 text-xs font-mono text-slate-400">{d.license}</td>
              <td className="px-6 py-4 font-mono text-cyan-300">{d.assignedVehicle}</td>
              <td className="px-6 py-4 text-xs text-slate-400">
                <Badge variant="cyan">{d.source}</Badge>
              </td>
              <td className="px-6 py-4">
                <Badge variant={d.status === 'ON_DUTY' ? 'success' : 'neutral'}>{d.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
