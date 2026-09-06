'use client';

import React from 'react';
import { Send } from 'lucide-react';
import Button from '../ui/Button';

interface CopilotInputProps {
  inputQuery: string;
  setInputQuery: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function CopilotInput({
  inputQuery,
  setInputQuery,
  onSubmit,
  isLoading,
}: CopilotInputProps) {
  return (
    <div className="p-4 border-t border-slate-800/80 bg-[#0b1020]/80">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 focus-within:border-indigo-500 transition-colors shadow-inner"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about operations, vehicles, rules, tickets..."
          className="flex-1 px-4 py-2 bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
        />
        <Button
          variant="primary"
          size="sm"
          loading={isLoading}
          disabled={!inputQuery.trim()}
          icon={<Send className="w-4 h-4" />}
        />
      </form>
    </div>
  );
}
