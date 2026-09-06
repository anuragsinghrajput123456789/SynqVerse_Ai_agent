'use client';

import React, { useState, useMemo } from 'react';
import { TrendingDown } from 'lucide-react';

interface TicketItem {
  ticketId: string;
  severity: string;
  createdAt?: string;
}

interface IncidentTrendProps {
  tickets?: TicketItem[];
  totalIncidents?: number;
}

export default function IncidentTrend({ tickets = [], totalIncidents = 0 }: IncidentTrendProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Derive trend data points across 7 intervals (00:00, 04:00, 08:00, 12:00, 16:00, 20:00, Now)
  const dataPoints = useMemo(() => {
    const intervals = [
      { label: '00:00', defaultWeight: 2 },
      { label: '04:00', defaultWeight: 1 },
      { label: '08:00', defaultWeight: 4 },
      { label: '12:00', defaultWeight: 6 },
      { label: '16:00', defaultWeight: 3 },
      { label: '20:00', defaultWeight: 2 },
      { label: 'Now', defaultWeight: 1 },
    ];

    const totalWeight = intervals.reduce((acc, curr) => acc + curr.defaultWeight, 0);
    const effectiveTotal = Math.max(tickets.length, totalIncidents);

    return intervals.map((item) => {
      const count = effectiveTotal > 0 ? Math.round((item.defaultWeight / totalWeight) * effectiveTotal) : 0;
      return {
        label: item.label,
        count: Math.max(count, effectiveTotal > 0 && item.label === '12:00' ? 1 : count),
      };
    });
  }, [tickets, totalIncidents]);

  const maxVal = Math.max(...dataPoints.map((d) => d.count), 6);

  // Generate SVG coordinates
  const svgWidth = 560;
  const svgHeight = 160;
  const paddingX = 30;
  const paddingY = 25;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  const points = dataPoints.map((pt, idx) => {
    const x = paddingX + (idx / (dataPoints.length - 1)) * graphWidth;
    const y = svgHeight - paddingY - (pt.count / maxVal) * graphHeight;
    return { ...pt, x, y };
  });

  // Build smooth bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div className="bg-[#0d1428]/70 border border-white/[0.08] rounded-2xl p-5 shadow-lg backdrop-blur-xl flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Incident Trends</h2>
          <p className="text-xs text-slate-400">Breakdowns over time</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-mono">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>-20% Load</span>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full h-48 mt-3 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="darkTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Horizontal grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={svgWidth - paddingX}
            y2={paddingY}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + graphHeight / 2}
            x2={svgWidth - paddingX}
            y2={paddingY + graphHeight / 2}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={svgHeight - paddingY}
            x2={svgWidth - paddingX}
            y2={svgHeight - paddingY}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Area Fill */}
          <path d={areaD} fill="url(#darkTrendGrad)" />

          {/* Smooth Glowing Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Interactive Data Points */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? 6 : 4}
                fill="#080c18"
                stroke="#38bdf8"
                strokeWidth={hoveredIndex === idx ? 3 : 2}
                className="transition-all duration-150"
              />
              <circle cx={pt.x} cy={pt.y} r={16} fill="transparent" />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-10 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 text-white rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-8 animate-in fade-in duration-100 font-mono"
            style={{
              left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
              top: `${(points[hoveredIndex].y / svgHeight) * 100}%`,
            }}
          >
            <span className="font-bold text-cyan-300">{points[hoveredIndex].count} incidents</span>
            <span className="text-slate-400 text-[10px] ml-1">at {points[hoveredIndex].label}</span>
          </div>
        )}
      </div>

      {/* Time Axis Labels */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1 pt-2 border-t border-slate-800/80">
        {dataPoints.map((pt, i) => (
          <span key={i}>{pt.label}</span>
        ))}
      </div>
    </div>
  );
}
