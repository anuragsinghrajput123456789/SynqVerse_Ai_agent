'use client';

import React, { RefObject } from 'react';
import { Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import Badge from '../ui/Badge';
import { CopilotSourceItem } from './CopilotSourceDrawer';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: string[];
  sources?: CopilotSourceItem[];
}

interface CopilotChatListProps {
  messages: CopilotMessage[];
  suggestedQuestions: string[];
  onSelectSuggestion: (question: string) => void;
  onCopy: (id: string, content: string) => void;
  copiedId: string | null;
  onRegenerate: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export default function CopilotChatList({
  messages,
  suggestedQuestions,
  onSelectSuggestion,
  onCopy,
  copiedId,
  onRegenerate,
  messagesEndRef,
}: CopilotChatListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center space-y-4 py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">How can I assist your dispatch operations?</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Ask about vehicle eligibility, breakdown triage status, client SLAs, or maintenance history.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 w-full max-w-md">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onSelectSuggestion(q)}
                className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs text-left transition-colors cursor-pointer"
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div
                className={`max-w-2xl rounded-3xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
                }`}
              >
                <p>{msg.content}</p>

                {/* Citations */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">
                      Authoritative Citations:
                    </span>
                    {msg.citations.map((c, i) => (
                      <Badge key={i} variant="purple" size="sm">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp & Utilities */}
              <div className="flex items-center gap-3 px-2 text-[10px] text-slate-500">
                <span>{msg.timestamp}</span>
                {!isUser && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onCopy(msg.id, msg.content)}
                      className="hover:text-slate-300 transition-colors p-1 cursor-pointer"
                      title="Copy grounded response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={onRegenerate}
                      className="hover:text-slate-300 transition-colors p-1 cursor-pointer"
                      title="Re-query with active context"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
