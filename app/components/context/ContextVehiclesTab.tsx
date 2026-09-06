'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Truck, ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';
import { vehiclesData, VehicleContextItem } from './data';

interface ContextVehiclesTabProps {
  searchQuery?: string;
}

export default function ContextVehiclesTab({ searchQuery = '' }: ContextVehiclesTabProps) {
  const filtered = vehiclesData.filter((v) =>
    v.vehicleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [selectedId, setSelectedId] = useState(filtered[0]?.vehicleId || 'TRK-104');
  const selectedVehicle: VehicleContextItem =
    filtered.find((v) => v.vehicleId === selectedId) || vehiclesData[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: List */}
      <div className="lg:col-span-5 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span>Vehicle &amp; Location</span>
          <span>Status</span>
        </div>

        <div className="space-y-2">
          {filtered.map((v) => {
            const isSelected = v.vehicleId === selectedVehicle.vehicleId;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.vehicleId)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:text-indigo-300'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white font-mono">{v.vehicleId}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                      <span>Raw: &ldquo;{v.rawPlate}&rdquo;</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={v.status === 'ACTIVE' ? 'success' : v.status === 'MAINTENANCE' ? 'warning' : 'info'}
                  >
                    {v.status}
                  </Badge>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Entity Provenance & Specs Card */}
      <div className="lg:col-span-7 rounded-3xl glass-panel border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white font-mono">{selectedVehicle.vehicleId}</h2>
              <Badge variant={selectedVehicle.status === 'ACTIVE' ? 'success' : 'warning'}>
                {selectedVehicle.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Normalized Plate: <span className="text-white font-semibold">{selectedVehicle.registrationNumber}</span>
            </p>
          </div>

          <div className="text-right space-y-1">
            <Badge variant="cyan" dot>
              {selectedVehicle.authority}
            </Badge>
            <p className="text-[10px] text-slate-500 font-mono">Source: {selectedVehicle.source}</p>
          </div>
        </div>

        {/* Truck Render */}
        <div className="relative rounded-2xl overflow-hidden h-48 bg-[#090d1a] border border-slate-800 group">
          <Image
            src="/truck.jpg"
            alt="Heavy commercial freight truck"
            fill
            className="object-cover object-center opacity-85 group-hover:scale-105 transition-all duration-500"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d1a] via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4">
            <p className="text-xs font-bold text-white">{selectedVehicle.model}</p>
            <p className="text-[10px] text-cyan-300 font-mono">Telemetry: Live Location {selectedVehicle.location}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Total Trips</span>
            <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">
              {selectedVehicle.totalTrips}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Open Tickets</span>
            <span className="text-xl font-extrabold text-amber-400 font-mono mt-0.5 block">
              {selectedVehicle.openTickets}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Last Maintenance</span>
            <span className="text-xs font-bold text-slate-200 font-mono mt-1.5 block truncate">
              {selectedVehicle.lastMaintenance}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
