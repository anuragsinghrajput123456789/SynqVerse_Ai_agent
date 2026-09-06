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

export default function CopilotPanel() {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, interimTranscript]);

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
    [inputQuery, loading, messages]
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-950/80 text-amber-300 border border-amber-800/80">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          Insufficient Data
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-950/80 text-rose-300 border border-rose-800/80">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          System Error
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        Grounded {confidence ? `(${confidence})` : ''}
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col h-[650px] relative">
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/90 text-white p-2 rounded-lg shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Grafity Operations Copilot</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                Voice & RAG
              </span>
            </div>
            <p className="text-xs text-slate-400">Multilingual voice navigation & deterministic context engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs">
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => {
                const lang = e.target.value as SupportedLanguageCode;
                setSelectedLanguage(lang);
                speechRecognitionRef.current?.setLanguage(lang);
              }}
              aria-label="Select voice and recognition language"
              className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            title="Clear Chat Memory"
            aria-label="Reset conversation history"
            className="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 border border-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/70 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-indigo-400" />
          Suggestions:
        </span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            disabled={loading || voiceState === 'LISTENING'}
            className="text-xs whitespace-nowrap bg-slate-800/80 hover:bg-indigo-950 hover:text-indigo-200 hover:border-indigo-700/60 text-slate-300 border border-slate-700/60 px-2.5 py-1 rounded-full transition cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Error / Alert Banner */}
      {voiceErrorMessage && (
        <div className="px-4 py-2 bg-rose-950/60 border-b border-rose-900/60 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{voiceErrorMessage}</span>
          </div>
          <button
            onClick={() => setVoiceErrorMessage(null)}
            className="text-rose-400 hover:text-white p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {/* Message Header for Assistant */}
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {msg.responsePayload &&
                      renderStatusBadge(
                        msg.responsePayload.status,
                        msg.responsePayload.confidence
                      )}
                  </div>
                  <div className="flex items-center gap-2">
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
                          className={`p-1 rounded-md text-xs transition cursor-pointer flex items-center gap-1 ${
                            activeSpeakingMsgId === msg.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800'
                          }`}
                        >
                          {activeSpeakingMsgId === msg.id && !isPausedPlayback ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span className="text-[10px] hidden sm:inline">Pause</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[10px] hidden sm:inline">Listen</span>
                            </>
                          )}
                        </button>

                        {activeSpeakingMsgId === msg.id && (
                          <button
                            onClick={handleStopAudio}
                            aria-label="Stop audio response"
                            title="Stop Audio"
                            className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 text-xs transition cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                  </div>
                </div>
              )}

              {/* Message Body */}
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              {/* Entities & Rules Pills */}
              {msg.responsePayload &&
                (msg.responsePayload.entities.length > 0 || msg.responsePayload.rules.length > 0) && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5 text-xs">
                    {msg.responsePayload.entities.map((ent) => (
                      <span
                        key={ent}
                        className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 text-[11px] font-mono"
                      >
                        🏷️ {ent}
                      </span>
                    ))}
                    {msg.responsePayload.rules.map((rule) => (
                      <span
                        key={rule}
                        className="px-2 py-0.5 rounded bg-indigo-950 text-amber-300 border border-amber-800/60 text-[11px] font-mono"
                      >
                        📜 Rule {rule}
                      </span>
                    ))}
                  </div>
                )}

              {/* Citations & Evidence Pill List */}
              {msg.responsePayload && msg.responsePayload.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    Verified Source Citations ({msg.responsePayload.sources.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.responsePayload.sources.map((src, sIdx) => (
                      <button
                        key={`${src.sourceId}-${sIdx}`}
                        onClick={() => setSelectedCitation(src)}
                        className="text-xs bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-slate-700/80 hover:border-indigo-500/80 px-2.5 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer text-left"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        <span className="font-mono font-medium text-[11px]">{src.title}</span>
                        <span className="text-[10px] text-slate-400">P{src.precedence}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Live Listening Indicator */}
        {voiceState === 'LISTENING' && (
          <div className="flex gap-3 justify-start animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-700/50 text-red-400 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-950 border border-red-900/60 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
              <div className="flex items-center gap-2 text-xs font-mono text-red-400 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>Listening ({selectedLanguage.toUpperCase()})... Speak naturally</span>
              </div>
              <p className="text-sm text-slate-200 italic">
                {interimTranscript || '"Listening to speech..."'}
              </p>
            </div>
          </div>
        )}

        {/* AI Thinking Animation */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 max-w-[70%]">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Retrieving context & synthesizing response...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone Voice Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            aria-label={voiceState === 'LISTENING' ? 'Stop voice recording' : 'Start voice recording'}
            title={voiceState === 'LISTENING' ? 'Stop Recording' : 'Speak to Copilot'}
            className={`p-2.5 rounded-lg text-sm font-medium transition cursor-pointer flex items-center justify-center ${
              voiceState === 'LISTENING'
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-lg shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700'
            }`}
          >
            {voiceState === 'LISTENING' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              voiceState === 'LISTENING'
                ? 'Listening to microphone...'
                : 'Ask via voice or text in English, Hindi, or Hinglish...'
            }
            disabled={loading || voiceState === 'LISTENING'}
            aria-label="Operations query input"
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-200 placeholder-slate-500 rounded-lg px-4 py-2.5 outline-none transition disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || loading || voiceState === 'LISTENING'}
            aria-label="Send question"
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* Evidence Citation Modal */}
      {selectedCitation && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[85%] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Evidence Citation Details</h3>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                aria-label="Close evidence modal"
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3 overflow-y-auto text-xs text-slate-300">
              <div>
                <span className="text-slate-500 font-mono block text-[10px] uppercase">Source ID</span>
                <span className="font-mono text-indigo-300">{selectedCitation.sourceId}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block text-[10px] uppercase">Source Title / Document</span>
                <span className="font-medium text-white">{selectedCitation.title}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block text-[10px] uppercase">Source Precedence Tier</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  Tier {selectedCitation.precedence} (
                  {selectedCitation.precedence === 1
                    ? 'Fleet Master / Driver Roster'
                    : selectedCitation.precedence === 2
                    ? 'Workshop Maintenance Log'
                    : selectedCitation.precedence === 3
                    ? 'Trips & Tickets'
                    : selectedCitation.precedence === 4
                    ? 'Email Agreement'
                    : 'Transcript / Mechanic Notes'}
                  )
                </span>
              </div>
              {selectedCitation.resolutionReason && (
                <div>
                  <span className="text-slate-500 font-mono block text-[10px] uppercase">Resolution Authority / Reason</span>
                  <p className="mt-0.5 text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed">
                    {selectedCitation.resolutionReason}
                  </p>
                </div>
              )}
              {Boolean(selectedCitation.resolvedValue) && (
                <div>
                  <span className="text-slate-500 font-mono block text-[10px] uppercase">Grounded Record Payload</span>
                  <pre className="mt-0.5 bg-slate-950 p-2.5 rounded border border-slate-800 overflow-x-auto text-[11px] font-mono text-slate-300">
                    {JSON.stringify(selectedCitation.resolvedValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Close Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
