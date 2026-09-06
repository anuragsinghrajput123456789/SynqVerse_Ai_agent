'use client';

import React from 'react';

interface SOSHoldCircleProps {
  isHolding: boolean;
  progress: number;
}

export default function SOSHoldCircle({ isHolding, progress }: SOSHoldCircleProps) {
  if (!isHolding) return null;

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg
      className="absolute -inset-2.5 w-17 h-17 transform -rotate-90 pointer-events-none z-20"
      viewBox="0 0 60 60"
    >
      <circle
        cx="30"
        cy="30"
        r={radius}
        className="text-pink-950/40"
        strokeWidth="4"
        stroke="currentColor"
        fill="transparent"
      />
      <circle
        cx="30"
        cy="30"
        r={radius}
        className="text-pink-400"
        strokeWidth="4.5"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
      />
    </svg>
  );
}
