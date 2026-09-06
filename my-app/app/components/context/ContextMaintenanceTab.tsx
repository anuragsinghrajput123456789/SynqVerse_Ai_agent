'use client';

import React from 'react';
import Badge from '../ui/Badge';
import { maintenanceData } from './data';

interface ContextMaintenanceTabProps {
  searchQuery?: string;
}

export default function ContextMaintenanceTab({ searchQuery = '' }: ContextMaintenanceTabProps) {
  const filtered = maintenanceData.filter(
    (m) =>
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mechanic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#0b1020] text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800/80">
          <tr>
            <th className="px-6 py-4 font-mono">Log ID</th>
            <th className="px-6 py-4 font-mono">Vehicle</th>
            <th className="px-6 py-4">Component Service</th>
            <th className="px-6 py-4">Odometer</th>
            <th className="px-6 py-4">Workshop / Mechanic</th>
            <th className="px-6 py-4">Rule Evaluation</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {filtered.map((m) => (
            <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-6 py-4 font-mono font-bold text-indigo-400">{m.id}</td>
              <td className="px-6 py-4 font-mono text-slate-200">{m.vehicle}</td>
              <td className="px-6 py-4 text-white font-medium">{m.component}</td>
              <td className="px-6 py-4 font-mono text-slate-400">{m.odometerKm.toLocaleString()} km</td>
              <td className="px-6 py-4 text-slate-300 text-xs">{m.mechanic}</td>
              <td className="px-6 py-4 text-xs font-mono text-purple-400">{m.ruleCitation}</td>
              <td className="px-6 py-4">
                <Badge variant={m.status === 'COMPLETED' ? 'success' : 'critical'}>
                  {m.status.replace('_', ' ')}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
