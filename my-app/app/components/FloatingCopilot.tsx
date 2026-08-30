'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  HelpCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  Pause,
  Square,
  Languages,
  Minus,
} from 'lucide-react';
import { CopilotQueryResponse, SourceCitationDetail, ConversationMessage } from '@/lib/copilot/types';
import {
  BrowserSpeechRecognitionService,
  BrowserSpeechSynthesisService,
  SupportedLanguageCode,
  SUPPORTED_LANGUAGES,
  getTtsLanguage,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  VoiceState,
} from '@/lib/voice';

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  responsePayload?: CopilotQueryResponse;
}

let messageCounter = 0;
function nextMsgId(prefix: string): string {
  messageCounter++;
  return `${prefix}-${messageCounter}`;
}

const SUGGESTED_PROMPTS = [
  'Why was TRK-104 rejected?',
  'TRK-104 ko reject kyun kiya?',
  'What maintenance issues does TRK-104 have?',
  'What was the vehicle\'s recent trip history?',
  'What is Shakti Cement\'s operational SLA?',
  'What happened to ticket TKT-0027?',
  'Show the evidence for this decision.',
];

export default function FloatingCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        'Hello! I am the **Grafity Operations Copilot**. Ask me any question using text or voice (English, Hindi, or Hinglish) about fleet assets, maintenance histories, breakdown decisions, or client agreements.',
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<SourceCitationDetail | null>(null);

  // Voice States
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguageCode>('auto');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceErrorMessage, setVoiceErrorMessage] = useState<string | null>(null);
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [isPausedPlayback, setIsPausedPlayback] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<BrowserSpeechRecognitionService | null>(null);
  const speechSynthesisRef = useRef<BrowserSpeechSynthesisService | null>(null);

  // Initialize Speech Services
  useEffect(() => {
    speechRecognitionRef.current = new BrowserSpeechRecognitionService();
    speechSynthesisRef.current = new BrowserSpeechSynthesisService();

    return () => {
      speechRecognitionRef.current?.abort();
      speechSynthesisRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, interimTranscript, isOpen, isMinimized]);

  const handleSend = useCallback(
    async (queryText?: string) => {
      const textToSend = (queryText || inputQuery).trim();
      if (!textToSend || loading) return;

      // Stop speech synthesis if playing
      speechSynthesisRef.current?.stop();
      setActiveSpeakingMsgId(null);
      setIsPausedPlayback(false);

      const userMessage: ChatEntry = {
        id: nextMsgId('user'),
        role: 'user',
        content: textToSend,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputQuery('');
      setInterimTranscript('');
      setVoiceErrorMessage(null);
      setLoading(true);

      // Build bounded conversation history for follow-up resolution
      const historyPayload: ConversationMessage[] = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      try {
        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: textToSend,
            conversationHistory: historyPayload,
          }),
        });

        const data: CopilotQueryResponse = await res.json();

        const assistantMessage: ChatEntry = {
          id: nextMsgId('assistant'),
          role: 'assistant',
          content: data.answer || 'No response returned from copilot.',
          timestamp: 'Just now',
          responsePayload: data,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        if (!isOpen || isMinimized) {
          setUnreadCount((c) => c + 1);
        }
      } catch (err: unknown) {
        const errorMessage: ChatEntry = {
          id: nextMsgId('err'),
          role: 'assistant',
          content: `Error communicating with Operations Copilot: ${
            err instanceof Error ? err.message : 'Unknown connection error'
          }`,
          timestamp: 'Just now',
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [inputQuery, loading, messages, isOpen, isMinimized]
  );

  // Toggle Voice Recording
  const handleToggleListening = () => {
    if (voiceState === 'LISTENING') {
      speechRecognitionRef.current?.stopListening();
      setVoiceState('IDLE');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceErrorMessage('Voice input is not supported in this browser. You can type your question instead.');
      setVoiceState('ERROR');
      return;
    }

    setVoiceErrorMessage(null);
    setInterimTranscript('');
    speechRecognitionRef.current?.setLanguage(selectedLanguage);

    speechRecognitionRef.current?.startListening({
      onStart: () => {
        setVoiceState('LISTENING');
      },
      onInterimResult: (interim) => {
        setInterimTranscript(interim);
      },
      onFinalResult: (result) => {
        setInterimTranscript('');
        setVoiceState('IDLE');
        if (result.text.trim()) {
          setInputQuery(result.text);
          handleSend(result.text);
        }
      },
      onError: (error) => {
        setVoiceState('ERROR');
        setVoiceErrorMessage(error.message);
        setInterimTranscript('');
      },
      onEnd: () => {
        setVoiceState('IDLE');
      },
    });
  };

  // Text-to-Speech Playback Controls
  const handlePlayAudio = (message: ChatEntry) => {
    if (!speechSynthesisRef.current) return;

    if (activeSpeakingMsgId === message.id) {
      if (isPausedPlayback) {
        speechSynthesisRef.current.resume();
        setIsPausedPlayback(false);
      } else {
        speechSynthesisRef.current.pause();
        setIsPausedPlayback(true);
      }
      return;
    }

    speechSynthesisRef.current.stop();
    setActiveSpeakingMsgId(message.id);
    setIsPausedPlayback(false);

    const ttsLang = getTtsLanguage(selectedLanguage);

    speechSynthesisRef.current.speak(
      message.content,
      { lang: ttsLang, rate: 1.0 },
      {
        onStart: () => {
          setIsPausedPlayback(false);
        },
        onEnd: () => {
          setActiveSpeakingMsgId(null);
          setIsPausedPlayback(false);
        },
        onError: () => {
          setActiveSpeakingMsgId(null);
          setIsPausedPlayback(false);
        },
      }
    );
  };

  const handleStopAudio = () => {
    speechSynthesisRef.current?.stop();
    setActiveSpeakingMsgId(null);
    setIsPausedPlayback(false);
  };

  const handleClearHistory = () => {
    speechSynthesisRef.current?.stop();
    setActiveSpeakingMsgId(null);
    setIsPausedPlayback(false);
    setMessages([
      {
        id: 'init-reset',
        role: 'assistant',
        content: 'Conversation history cleared. Ready for your next operational query.',
        timestamp: 'Just now',
      },
    ]);
  };

  const renderStatusBadge = (status?: string, confidence?: string | number) => {
    if (status === 'insufficient_data') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/80">
          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
          Insufficient Data
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800/80">
          <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
          Error
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
        Grounded {confidence ? `(${confidence})` : ''}
      </span>
    );
  };

  return (
    <>
      {/* Floating Action Button Trigger */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setUnreadCount(0);
            }}
            aria-label="Open Operations Copilot"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-indigo-400/40"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
            </span>

            {/* Unread Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full border-2 border-slate-950">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating Chatbot Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[440px] max-w-[calc(100vw-2rem)] bg-slate-900/98 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/80 flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-14' : 'h-[620px] max-h-[calc(100vh-5rem)]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold text-white">Operations Copilot</h2>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                    Voice & RAG
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Deterministic Logistics AI</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language Selector */}
              {!isMinimized && (
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md text-xs">
                  <Languages className="w-3 h-3 text-indigo-400" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      const lang = e.target.value as SupportedLanguageCode;
                      setSelectedLanguage(lang);
                      speechRecognitionRef.current?.setLanguage(lang);
                    }}
                    aria-label="Select voice language"
                    className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reset History */}
              {!isMinimized && (
                <button
                  onClick={handleClearHistory}
                  title="Clear Chat Memory"
                  aria-label="Reset conversation history"
                  className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-800 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Minimize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand window' : 'Minimize window'}
                aria-label="Minimize or expand window"
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-800 transition cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                  speechSynthesisRef.current?.stop();
                }}
                title="Close Copilot"
                aria-label="Close Operations Copilot window"
                className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Suggested Quick Prompt Chips */}
              <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/70 overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0">
                <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap flex items-center gap-1">
                  <HelpCircle className="w-2.5 h-2.5 text-indigo-400" />
                  Quick:
                </span>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    disabled={loading || voiceState === 'LISTENING'}
                    className="text-[11px] whitespace-nowrap bg-slate-800/80 hover:bg-indigo-950 hover:text-indigo-200 hover:border-indigo-700/60 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-full transition cursor-pointer disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Error / Alert Banner */}
              {voiceErrorMessage && (
                <div className="px-3 py-1.5 bg-rose-950/60 border-b border-rose-900/60 text-rose-300 text-xs flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-[11px]">{voiceErrorMessage}</span>
                  </div>
                  <button
                    onClick={() => setVoiceErrorMessage(null)}
                    className="text-rose-400 hover:text-white p-0.5"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-900/70">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {/* Message Header for Assistant */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            {msg.responsePayload &&
                              renderStatusBadge(
                                msg.responsePayload.status,
                                msg.responsePayload.confidence
                              )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* TTS Audio Controls */}
                            {isSpeechSynthesisSupported() && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handlePlayAudio(msg)}
                                  aria-label={
                                    activeSpeakingMsgId === msg.id && !isPausedPlayback
                                      ? 'Pause audio response'
                                      : 'Listen to response'
                                  }
                                  title={
                                    activeSpeakingMsgId === msg.id && !isPausedPlayback
                                      ? 'Pause Audio'
                                      : 'Listen to Answer'
                                  }
                                  className={`p-1 rounded-md text-[11px] transition cursor-pointer flex items-center gap-1 ${
                                    activeSpeakingMsgId === msg.id
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                                  }`}
                                >
                                  {activeSpeakingMsgId === msg.id && !isPausedPlayback ? (
                                    <>
                                      <Pause className="w-3 h-3" />
                                      <span className="text-[10px]">Pause</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3 h-3" />
                                      <span className="text-[10px]">Listen</span>
                                    </>
                                  )}
                                </button>

                                {activeSpeakingMsgId === msg.id && (
                                  <button
                                    onClick={handleStopAudio}
                                    aria-label="Stop audio response"
                                    title="Stop Audio"
                                    className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 text-[11px] transition cursor-pointer"
                                  >
                                    <Square className="w-3 h-3 fill-current" />
                                  </button>
                                )}
                              </div>
                            )}
                            <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
                          </div>
                        </div>
                      )}

                      {/* Message Body */}
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                      {/* Entities & Rules Pills */}
                      {msg.responsePayload &&
                        (msg.responsePayload.entities.length > 0 || msg.responsePayload.rules.length > 0) && (
                          <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex flex-wrap items-center gap-1 text-[10px]">
                            {msg.responsePayload.entities.map((ent) => (
                              <span
                                key={ent}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-mono"
                              >
                                🏷️ {ent}
                              </span>
                            ))}
                            {msg.responsePayload.rules.map((rule) => (
                              <span
                                key={rule}
                                className="px-1.5 py-0.5 rounded bg-indigo-950 text-amber-300 border border-amber-800/60 font-mono"
                              >
                                📜 Rule {rule}
                              </span>
                            ))}
                          </div>
                        )}

                      {/* Citations & Evidence Pill List */}
                      {msg.responsePayload && msg.responsePayload.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5 text-indigo-400" />
                            Verified Citations ({msg.responsePayload.sources.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {msg.responsePayload.sources.map((src, sIdx) => (
                              <button
                                key={`${src.sourceId}-${sIdx}`}
                                onClick={() => setSelectedCitation(src)}
                                className="text-[11px] bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-slate-700/80 hover:border-indigo-500/80 px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer text-left"
                              >
                                <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                <span className="font-mono font-medium">{src.title}</span>
                                <span className="text-[9px] text-slate-400">P{src.precedence}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Live Listening Indicator */}
                {voiceState === 'LISTENING' && (
                  <div className="flex gap-2.5 justify-start animate-in fade-in duration-200">
                    <div className="w-7 h-7 rounded-lg bg-red-950 border border-red-700/50 text-red-400 flex items-center justify-center shrink-0">
                      <Mic className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div className="bg-slate-950 border border-red-900/60 rounded-2xl rounded-tl-none p-3 max-w-[85%]">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-red-400 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        <span>Listening ({selectedLanguage.toUpperCase()})... Speak naturally</span>
                      </div>
                      <p className="text-xs text-slate-200 italic">
                        {interimTranscript || '"Listening to speech..."'}
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Thinking Animation */}
                {loading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          Retrieving context...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-2.5 bg-slate-950 border-t border-slate-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-1.5"
                >
                  {/* Microphone Voice Button */}
                  <button
                    type="button"
                    onClick={handleToggleListening}
                    aria-label={voiceState === 'LISTENING' ? 'Stop voice recording' : 'Start voice recording'}
                    title={voiceState === 'LISTENING' ? 'Stop Recording' : 'Speak to Copilot'}
                    className={`p-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center ${
                      voiceState === 'LISTENING'
                        ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-md shadow-red-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {voiceState === 'LISTENING' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={
                      voiceState === 'LISTENING'
                        ? 'Listening to microphone...'
                        : 'Ask via voice or text in EN / HI / Hinglish...'
                    }
                    disabled={loading || voiceState === 'LISTENING'}
                    aria-label="Operations query input"
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 outline-none transition disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || loading || voiceState === 'LISTENING'}
                    aria-label="Send question"
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Evidence Citation Modal */}
          {selectedCitation && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3">
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-sm w-full max-h-[85%] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-semibold text-white">Citation Details</h3>
                  </div>
                  <button
                    onClick={() => setSelectedCitation(null)}
                    aria-label="Close evidence modal"
                    className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-3 space-y-2.5 overflow-y-auto text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 font-mono block text-[9px] uppercase">Source ID</span>
                    <span className="font-mono text-indigo-300">{selectedCitation.sourceId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono block text-[9px] uppercase">Document Title</span>
                    <span className="font-medium text-white">{selectedCitation.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono block text-[9px] uppercase">Precedence Tier</span>
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono text-[10px]">
                      Tier {selectedCitation.precedence} (
                      {selectedCitation.precedence === 1
                        ? 'Fleet Master / Roster'
                        : selectedCitation.precedence === 2
                        ? 'Maintenance Log'
                        : selectedCitation.precedence === 3
                        ? 'Trips & Tickets'
                        : selectedCitation.precedence === 4
                        ? 'Email Agreement'
                        : 'Interview Transcript'}
                      )
                    </span>
                  </div>
                  {selectedCitation.resolutionReason && (
                    <div>
                      <span className="text-slate-500 font-mono block text-[9px] uppercase">Authority Reason</span>
                      <p className="mt-0.5 text-slate-200 bg-slate-950 p-2 rounded border border-slate-800 leading-relaxed text-[11px]">
                        {selectedCitation.resolutionReason}
                      </p>
                    </div>
                  )}
                  {Boolean(selectedCitation.resolvedValue) && (
                    <div>
                      <span className="text-slate-500 font-mono block text-[9px] uppercase">Record Payload</span>
                      <pre className="mt-0.5 bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto text-[10px] font-mono text-slate-300">
                        {JSON.stringify(selectedCitation.resolvedValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedCitation(null)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-medium transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
