'use client';

import React from 'react';

interface GrafityLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  showSubtitle?: boolean;
  glow?: boolean;
  animated?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Authoritative Grafity Polygonal Wireframe Brand Logo
 * Recreated with geometric precision from the Grafity brand asset:
 * Faceted isometric 3D crystal prism forming the letter "G"
 * with glowing neon cyan, violet, and magenta vertices and facets.
 */
export default function GrafityLogo({
  size = 40,
  className = '',
  showText = false,
  showSubtitle = false,
  glow = true,
  animated = false,
  textSize = 'md',
}: GrafityLogoProps) {
  const textClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl lg:text-5xl',
  }[textSize];

  const subClasses = {
    sm: 'text-[7px]',
    md: 'text-[9px]',
    lg: 'text-[10px]',
    xl: 'text-[11px]',
  }[textSize];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Polygonal "G" Icon */}
      <div
        className={`relative shrink-0 flex items-center justify-center ${
          animated ? 'hover:scale-105 transition-transform duration-300' : ''
        }`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Primary Cyan-Indigo-Magenta Linear Gradients */}
            <linearGradient id="grafityEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="40%" stopColor="#38BDF8" />
              <stop offset="70%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#D946EF" />
            </linearGradient>

            <linearGradient id="grafityFacetGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.08" />
            </linearGradient>

            <linearGradient id="grafityFacetGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.10" />
            </linearGradient>

            <linearGradient id="grafityFacetGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.05" />
            </linearGradient>

            {/* Neon Glow Filter */}
            {glow && (
              <filter id="grafityNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur1" />
                <feGaussianBlur stdDeviation="7" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )}
          </defs>

          {/* Facet Fill Polygons (Semi-transparent crystalline shading) */}
          <g opacity="0.85">
            {/* Top Facet */}
            <polygon points="50,10 82,27 66,45 50,30" fill="url(#grafityFacetGrad1)" />
            {/* Top-Left Facet */}
            <polygon points="50,10 50,30 28,45 18,27" fill="url(#grafityFacetGrad1)" />
            {/* Left Upper Facet */}
            <polygon points="18,27 28,45 28,68 18,73" fill="url(#grafityFacetGrad3)" />
            {/* Left Lower Facet */}
            <polygon points="18,73 28,68 50,78 50,90" fill="url(#grafityFacetGrad2)" />
            {/* Bottom Facet */}
            <polygon points="50,90 50,78 68,68 82,73" fill="url(#grafityFacetGrad2)" />
            {/* G-Bar Upper Facet */}
            <polygon points="82,27 66,45 50,50 68,50" fill="url(#grafityFacetGrad1)" />
            {/* G-Bar Shelf Facet */}
            <polygon points="50,50 78,50 78,60 68,68 50,78" fill="url(#grafityFacetGrad2)" />
            {/* Center Core Facet */}
            <polygon points="50,30 66,45 50,50 28,45" fill="url(#grafityFacetGrad3)" />
          </g>

          {/* Glowing Wireframe Edges (The low-poly lattice structure) */}
          <g
            stroke="url(#grafityEdgeGrad)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter={glow ? 'url(#grafityNeonGlow)' : undefined}
          >
            {/* Outer Silhouette of Hexagonal "G" */}
            <polyline points="72,22 82,27 82,42" />
            <polyline points="72,22 50,10 18,27 18,73 50,90 82,73 82,50 54,50" />

            {/* Internal Structural Triangular Lattice */}
            {/* Top & Left Bridges */}
            <line x1="50" y1="10" x2="50" y2="30" stroke="#00F0FF" strokeWidth="1.8" />
            <line x1="50" y1="30" x2="18" y2="27" stroke="#22D3EE" strokeWidth="1.8" />
            <line x1="50" y1="30" x2="82" y2="27" stroke="#38BDF8" strokeWidth="1.8" />
            <line x1="50" y1="30" x2="28" y2="45" stroke="#38BDF8" strokeWidth="1.8" />
            <line x1="50" y1="30" x2="66" y2="45" stroke="#818CF8" strokeWidth="1.8" />

            {/* Left Edge Bracing */}
            <line x1="18" y1="27" x2="28" y2="45" stroke="#22D3EE" strokeWidth="1.8" />
            <line x1="28" y1="45" x2="18" y2="73" stroke="#818CF8" strokeWidth="1.8" />
            <line x1="28" y1="45" x2="28" y2="68" stroke="#6366F1" strokeWidth="1.8" />
            <line x1="28" y1="68" x2="18" y2="73" stroke="#A855F7" strokeWidth="1.8" />

            {/* Center Core & G Crossbar Lattice */}
            <line x1="28" y1="45" x2="50" y2="50" stroke="#818CF8" strokeWidth="2.0" />
            <line x1="66" y1="45" x2="50" y2="50" stroke="#A855F7" strokeWidth="2.0" />
            <line x1="66" y1="45" x2="82" y2="27" stroke="#818CF8" strokeWidth="1.8" />
            <line x1="54" y1="50" x2="82" y2="50" stroke="#D946EF" strokeWidth="2.4" />
            <line x1="72" y1="50" x2="68" y2="68" stroke="#EC4899" strokeWidth="1.8" />
            <line x1="82" y1="50" x2="82" y2="73" stroke="#EC4899" strokeWidth="2.2" />

            {/* Bottom & Right Lattice */}
            <line x1="28" y1="68" x2="50" y2="78" stroke="#A855F7" strokeWidth="1.8" />
            <line x1="50" y1="50" x2="50" y2="78" stroke="#A855F7" strokeWidth="1.8" />
            <line x1="68" y1="68" x2="50" y2="78" stroke="#D946EF" strokeWidth="1.8" />
            <line x1="50" y1="78" x2="50" y2="90" stroke="#EC4899" strokeWidth="2.0" />
            <line x1="68" y1="68" x2="82" y2="73" stroke="#F43F5E" strokeWidth="1.8" />
          </g>

          {/* Glowing Vertex Nodes (Intersection Points) */}
          <g fill="#FFFFFF">
            <circle cx="50" cy="10" r="2.5" fill="#00F0FF" />
            <circle cx="18" cy="27" r="2.2" fill="#22D3EE" />
            <circle cx="82" cy="27" r="2.2" fill="#38BDF8" />
            <circle cx="50" cy="30" r="2.5" fill="#38BDF8" />
            <circle cx="28" cy="45" r="2.2" fill="#818CF8" />
            <circle cx="66" cy="45" r="2.2" fill="#A855F7" />
            <circle cx="50" cy="50" r="2.5" fill="#A855F7" />
            <circle cx="82" cy="50" r="2.5" fill="#D946EF" />
            <circle cx="18" cy="73" r="2.2" fill="#C084FC" />
            <circle cx="28" cy="68" r="2.0" fill="#C084FC" />
            <circle cx="68" cy="68" r="2.2" fill="#EC4899" />
            <circle cx="82" cy="73" r="2.2" fill="#EC4899" />
            <circle cx="50" cy="78" r="2.2" fill="#F43F5E" />
            <circle cx="50" cy="90" r="2.5" fill="#F43F5E" />
          </g>
        </svg>
      </div>

      {/* Typography Wordmark + Subtitle */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-wider uppercase font-sans bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,240,255,0.35)] ${textClasses}`}
            >
              GRAFITY
            </span>
          </div>

          {showSubtitle && (
            <span
              className={`font-mono font-semibold tracking-widest uppercase text-slate-400 mt-0.5 ${subClasses}`}
            >
              SMART LOGISTICS • AI-POWERED OPTIMIZATION • END-TO-END VISIBILITY
            </span>
          )}
        </div>
      )}
    </div>
  );
}
