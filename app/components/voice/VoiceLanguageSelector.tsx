'use client';

import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { SupportedLanguageCode, SUPPORTED_LANGUAGES } from '@/lib/voice';

export interface VoiceLanguageSelectorProps {
  value: SupportedLanguageCode;
  onChange: (val: SupportedLanguageCode) => void;
  className?: string;
}

export default function VoiceLanguageSelector({
  value,
  onChange,
  className = '',
}: VoiceLanguageSelectorProps) {
  return (
    <div
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-inner transition-colors ${className}`}
    >
      <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SupportedLanguageCode)}
        aria-label="Select voice language"
        className="appearance-none bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-4"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
            {lang.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 text-slate-500 pointer-events-none absolute right-2" />
    </div>
  );
}
