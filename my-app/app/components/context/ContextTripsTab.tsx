'use client';

import React from 'react';
import Badge from '../ui/Badge';
import { tripsData } from './data';

interface ContextTripsTabProps {
  searchQuery?: string;
}

export default function ContextTripsTab({ searchQuery = '' }: ContextTripsTabProps) {
  const filtered = tripsData.filter(
    (t) =>
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#0b1020] text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800/80">
          <tr>
            <th className="px-6 py-4 font-mono">Trip ID</th>
            <th className="px-6 py-4 font-mono">Vehicle</th>
            <th className="px-6 py-4">Origin Hub</th>
            <th className="px-6 py-4">Destination</th>
            <th className="px-6 py-4">Client</th>
            <th className="px-6 py-4">Km Completed</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {filtered.map((t) => (
            <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-6 py-4 font-mono font-bold text-indigo-400">{t.id}</td>
              <td className="px-6 py-4 font-mono text-slate-200">{t.vehicle}</td>
              <td className="px-6 py-4 text-slate-300">{t.origin}</td>
              <td className="px-6 py-4 text-slate-300">{t.destination}</td>
              <td className="px-6 py-4 text-cyan-300 font-medium">{t.client}</td>
              <td className="px-6 py-4 font-mono text-slate-400">{t.kmCompleted} km</td>
              <td className="px-6 py-4">
                <Badge variant={t.status === 'IN_TRANSIT' ? 'cyan' : 'critical'}>
                  {t.status.replace('_', ' ')}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
