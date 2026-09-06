'use client';

import Image from 'next/image';
import { MapPin, ArrowUpRight } from 'lucide-react';

export default function FleetRouteCard() {
  return (
    <div className="relative rounded-3xl overflow-hidden glass-panel border border-slate-800 p-5 flex flex-col justify-between min-h-[220px] group hover:border-cyan-500/40 transition-all duration-300">
      {/* Background Image / Render */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/truck.jpg"
          alt="3D Heavy Freight Truck"
          fill
          className="object-cover object-center opacity-40 group-hover:scale-105 group-hover:opacity-50 transition-all duration-500"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d1a] via-[#090d1a]/70 to-transparent" />
      </div>

      {/* Top Floating Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur text-[11px] font-medium text-slate-200 shadow-md">
          <span>Moving operations with intelligence</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-mono font-medium">
          <MapPin className="w-3.5 h-3.5" />
          <span>Delhi</span>
        </div>
      </div>

      {/* Bottom Route Details */}
      <div className="relative z-10 mt-12 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Origin:</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Mumbai
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400 font-medium">Destination:</span>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Delhi (NH-48 Corridor)
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
              1,418 km
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              Optimal Telemetry
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-cyan-300 shadow-lg shadow-indigo-600/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
