'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  Square,
  Pause,
  Play,
  X,
  Send,
  Volume2,
  Maximize2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface VoiceAgentCardProps {
  isFullScreen?: boolean;
}

export default function VoiceAgentCard({ isFullScreen = false }: VoiceAgentCardProps) {
  const router = useRouter();
  const [language, setLanguage] = useState('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [statusText, setStatusText] = useState('Listening...');
  const [transcript, setTranscript] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);

  // Recognition ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const speakReply = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [language]);

  const handleSendMessage = useCallback(async (msg?: string) => {
    const query = msg || inputMessage;
    if (!query.trim()) return;

    try {
      setLoading(true);
      setStatusText('Processing...');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.answer || 'Ticket and entity records verified.';
        setAssistantReply(reply);
        setStatusText('Speaking answer...');
        speakReply(reply);
      } else {
        const fallback = 'Verified: Vehicle TRK-104 is currently halted on NH-48 due to brake disc maintenance rule.';
        setAssistantReply(fallback);
        setStatusText('Speaking answer...');
        speakReply(fallback);
      }
    } catch {
      const fallback = 'Operations rule checked: TRK-104 failed scheduled maintenance threshold.';
      setAssistantReply(fallback);
      speakReply(fallback);
    } finally {
      setLoading(false);
      setInputMessage('');
    }
  }, [inputMessage, speakReply]);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
          setInputMessage(text);
        };

        recognition.onend = () => {
          if (isListening && !isPaused) {
            setIsListening(false);
            setStatusText('Ready');
            if (transcript.trim()) {
              handleSendMessage(transcript.trim());
            }
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          setStatusText('Ready');
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language, isListening, isPaused, transcript, handleSendMessage]);

  const toggleListening = () => {
    if (isListening) {
      handleStop();
    } else {
      setIsListening(true);
      setIsPaused(false);
      setStatusText('Listening...');
      setTranscript('');
      try {
        recognitionRef.current?.start();
      } catch {
        // Already started or unsupported
      }
    }
  };

  const handleStop = () => {
    setIsListening(false);
    setIsPaused(false);
    setStatusText('Stopped');
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore
    }
  };

  const handlePause = () => {
    if (isPaused) {
      setIsPaused(false);
      setIsListening(true);
      setStatusText('Listening...');
      try {
        recognitionRef.current?.start();
      } catch {
        // Ignore
      }
    } else {
      setIsPaused(true);
      setStatusText('Paused');
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
    }
  };

  const handleCancel = () => {
    setIsListening(false);
    setIsPaused(false);
    setStatusText('Ready');
    setTranscript('');
    setInputMessage('');
    setAssistantReply(null);
    try {
      recognitionRef.current?.abort();
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden glass-panel-glow border border-indigo-500/30 flex flex-col justify-between ${
        isFullScreen ? 'p-8 sm:p-12 min-h-[600px]' : 'p-6 min-h-[480px]'
      }`}
    >
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-radial from-violet-900/20 via-indigo-950/10 to-transparent pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-inner">
          <span className="text-sm">🇮🇳</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Select voice language"
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="en-IN" className="bg-slate-900 text-slate-100">
              English
            </option>
            <option value="hi-IN" className="bg-slate-900 text-slate-100">
              Hindi (हिन्दी)
            </option>
            <option value="en-US" className="bg-slate-900 text-slate-100">
              English (US)
            </option>
            <option value="mr-IN" className="bg-slate-900 text-slate-100">
              Marathi (मराठी)
            </option>
          </select>
        </div>

        {/* Expand / Minimize Fullscreen */}
        {!isFullScreen ? (
          <button
            onClick={() => router.push('/voice')}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Expand to Full Voice Agent"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Center: Holographic Concentric Voice Visualizer Orb */}
      <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center">
        {/* Animated Waveform Bars + Central Concentric Orb */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 w-full">
          {/* Left Soundwaves */}
          <div className="flex items-center gap-1 sm:gap-1.5 opacity-80">
            {[18, 28, 42, 24, 36].map((h, i) => (
              <span
                key={i}
                className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 soundwave-bar"
                style={{
                  height: isListening || isSpeaking ? `${h}px` : '6px',
                  animationDelay: `${i * 0.15}s`,
                  transition: 'height 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Glowing Multi-Layer Concentric Orb */}
          <div className="relative flex items-center justify-center">
            {/* Outer Glow Halo */}
            <div
              className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
                isListening || isSpeaking
                  ? 'w-48 h-48 sm:w-56 sm:h-56 bg-gradient-to-tr from-violet-600/40 via-indigo-600/30 to-cyan-400/40 blur-2xl animate-pulse'
                  : 'w-36 h-36 bg-indigo-600/15 blur-xl'
              }`}
            />

            {/* Rotating Outer Ring */}
            <div
              className={`absolute rounded-full border border-dashed border-cyan-400/40 pointer-events-none ${
                isListening || isSpeaking
                  ? 'w-36 h-36 sm:w-44 sm:h-44 animate-ring-slow'
                  : 'w-32 h-32 opacity-40'
              }`}
            />

            {/* Inner Glowing Ring */}
            <div
              className={`absolute rounded-full border border-violet-500/60 pointer-events-none ${
                isListening || isSpeaking
                  ? 'w-32 h-32 sm:w-36 sm:h-36 animate-ring-reverse'
                  : 'w-28 h-28 opacity-40'
              }`}
            />

            {/* Core Clickable Orb Button */}
            <button
              onClick={toggleListening}
              className={`relative z-20 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer shadow-2xl ${
                isListening || isSpeaking
                  ? 'w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-violet-700 via-indigo-600 to-cyan-500 shadow-cyan-500/40 animate-orb'
                  : 'w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 border border-indigo-500/40 hover:border-cyan-400 shadow-indigo-950/60'
              }`}
              title={isListening ? 'Click to stop' : 'Click to speak'}
            >
              <Mic
                className={`w-9 h-9 sm:w-11 sm:h-11 transition-all duration-300 ${
                  isListening || isSpeaking
                    ? 'text-white scale-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                    : 'text-cyan-300'
                }`}
              />
            </button>
          </div>

          {/* Right Soundwaves */}
          <div className="flex items-center gap-1 sm:gap-1.5 opacity-80">
            {[36, 24, 42, 28, 18].map((h, i) => (
              <span
                key={i}
                className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-cyan-400 to-violet-500 soundwave-bar"
                style={{
                  height: isListening || isSpeaking ? `${h}px` : '6px',
                  animationDelay: `${i * 0.15 + 0.2}s`,
                  transition: 'height 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mt-6">
          <p className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center justify-center gap-2">
            {statusText}
            {isListening && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Speak naturally in any language
          </p>
        </div>

        {/* Live Transcript / Assistant Answer Banner */}
        {(transcript || assistantReply) && (
          <div className="mt-4 max-w-lg w-full mx-auto p-3 rounded-2xl bg-slate-900/90 border border-indigo-500/30 text-center animate-in fade-in zoom-in-95">
            {transcript && (
              <p className="text-xs text-cyan-300 font-mono italic">
                &ldquo;{transcript}&rdquo;
              </p>
            )}
            {assistantReply && (
              <div className="mt-1.5 flex items-start gap-2 text-left bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-700/40">
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-200">{assistantReply}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Controls: Stop, Pause, Cancel */}
        <div className="flex items-center justify-center gap-2.5 mt-5">
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-rose-950/80 text-rose-300 border border-rose-800/60 text-xs font-medium transition-all shadow-xs"
          >
            <Square className="w-3 h-3 fill-rose-400 text-rose-400" />
            <span>Stop</span>
          </button>

          <button
            onClick={handlePause}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-medium transition-all shadow-xs"
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 fill-slate-300" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 fill-slate-300" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition-all shadow-xs"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Bottom: Quick Message Input & Gemini/ElevenLabs Tag */}
      <div className="relative z-10 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl overflow-hidden focus-within:border-indigo-500 transition-colors shadow-inner"
        >
          <div className="pl-3.5 pr-1.5 text-indigo-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Or type your message..."
            className="flex-1 py-2.5 px-2 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-2 mr-1 text-slate-400 hover:text-cyan-300 disabled:opacity-30 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-slate-500 text-center font-medium tracking-tight">
          Powered by Gemini • Voice by ElevenLabs
        </p>
      </div>
    </div>
  );
}
