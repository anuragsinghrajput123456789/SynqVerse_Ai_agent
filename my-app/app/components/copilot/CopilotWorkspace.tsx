'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import Badge from '../ui/Badge';
import CopilotSidebar from './CopilotSidebar';
import CopilotChatList, { CopilotMessage } from './CopilotChatList';
import CopilotInput from './CopilotInput';
import CopilotSourceDrawer, { CopilotSourceItem } from './CopilotSourceDrawer';

export default function CopilotWorkspace() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'm1',
      role: 'user',
      content: 'Why was TRK-104 rejected?',
      timestamp: '10:20 AM',
    },
    {
      id: 'm2',
      role: 'assistant',
      content:
        'TRK-104 was rejected because it did not satisfy the applicable maintenance eligibility requirements under Fleet Safety Policy §4.2. Its brake disc calipers were overdue for scheduled overhaul by 420 km.',
      timestamp: '10:21 AM',
      citations: ['Maintenance Log', 'Dispatcher Rules', 'Decision Record'],
      sources: [
        {
          title: 'maintenance_logs.csv',
          authority: 'Authoritative',
          snippet: 'TRK-104: Brake Disc Calipers service overdue at 142,500 km',
        },
        {
          title: 'dispatcher_interview.txt',
          authority: 'Deterministic Rule R-001',
          snippet: 'Vehicles with overdue brake components are ineligible for long-haul corridor replacement',
          ruleId: 'R-001',
        },
        {
          title: 'Decision Record DEC-1042',
          authority: 'System Triage',
          snippet: 'Candidate TRK-104 disqualified. Candidate TRK-121 selected as primary replacement.',
        },
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<CopilotSourceItem[]>(messages[1]?.sources || []);
  const [activeSession, setActiveSession] = useState('Why was TRK-104 rejected?');

  const chatSessions = [
    'Why was TRK-104 rejected?',
    'Client for TRK-104',
    'BRK-1042 Status',
    'Replacement options for Adani',
    'BS6 compliance rules for Shakti Cement',
  ];

  const suggestedQuestions = [
    'Why was TRK-104 rejected?',
    'Who is the driver for TRK-104?',
    'What is the SLA turnaround for Shakti Cement?',
    'Find available trucks in Mumbai Hub',
  ];

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const msgIdRef = useRef(100);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `user-${++msgIdRef.current}`,
      role: 'user',
      content: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q.trim() }),
      });

      if (!res.ok) throw new Error('Failed to query copilot');

      const data = await res.json();
      const botMsg: CopilotMessage = {
        id: `bot-${++msgIdRef.current}`,
        role: 'assistant',
        content:
          data.answer ||
          "I don't have enough verified information to answer this based on the ingested records.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.source_refs || ['Fleet Master', 'Dispatcher Rules'],
        sources: [
          {
            title: 'Fleet & Dispatcher Context Graph',
            authority: 'Authoritative Verified',
            snippet: 'Retrieved verified facts from MongoDB store matching query terms.',
          },
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
      if (botMsg.sources) {
        setActiveSources(botMsg.sources);
      }
    } catch {
      const errorMsg: CopilotMessage = {
        id: `err-${++msgIdRef.current}`,
        role: 'assistant',
        content: 'Unable to reach grounding engine. Please verify system connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      handleSendMessage(lastUser.content);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] min-h-[640px] grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
      {/* 1. LEFT COLUMN: Conversation History */}
      <CopilotSidebar
        chatSessions={chatSessions}
        activeSession={activeSession}
        onSelectSession={(s) => {
          setActiveSession(s);
          handleSendMessage(s);
        }}
        onClearChat={() => {
          setMessages([]);
          setActiveSources([]);
        }}
      />

      {/* 2. CENTER COLUMN: Conversation Workspace */}
      <div className="lg:col-span-6 flex flex-col justify-between rounded-3xl glass-panel border border-slate-800 overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0b1020]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Grafity Operations Copilot
              </h2>
              <p className="text-[11px] text-slate-400">
                Grounded natural-language operational reasoning.
              </p>
            </div>
          </div>

          <Badge variant="cyan" dot pulse>
            Gemini 2.5 Flash Grounded
          </Badge>
        </div>

        {/* Message Stream */}
        <CopilotChatList
          messages={messages}
          suggestedQuestions={suggestedQuestions}
          onSelectSuggestion={(q) => handleSendMessage(q)}
          onCopy={handleCopy}
          copiedId={copiedId}
          onRegenerate={handleRegenerate}
          messagesEndRef={messagesEndRef}
        />

        {/* Input Bar */}
        <CopilotInput
          inputQuery={inputQuery}
          setInputQuery={setInputQuery}
          onSubmit={() => handleSendMessage()}
          isLoading={isLoading}
        />
      </div>

      {/* 3. RIGHT COLUMN: Context & Sources Inspection Drawer */}
      <CopilotSourceDrawer activeSources={activeSources} />
    </div>
  );
}
