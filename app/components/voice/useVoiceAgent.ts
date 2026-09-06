'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceState,
  SupportedLanguageCode,
  VoiceError,
  isSpeechRecognitionSupported,
} from '@/lib/voice';
import { defaultVoiceService, ChatQueryResponse } from './voiceService';

export interface TranscriptItem {
  id: string;
  speaker: 'user' | 'agent';
  text: string;
  timestamp: string;
  language?: string;
  status?: 'grounded' | 'insufficient_data';
  citations?: string[];
}

export type VoiceInteractionMode = 'VOICE' | 'CHAT';

export interface SuggestedPrompt {
  id: string;
  label: string;
  category: 'fleet' | 'rules' | 'incidents' | 'multilingual';
  language: 'en' | 'hi' | 'hinglish';
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: '1', label: 'Why was TRK-104 rejected?', category: 'rules', language: 'en' },
  { id: '2', label: 'What vehicles are available?', category: 'fleet', language: 'en' },
  { id: '3', label: "Show me today's critical incidents.", category: 'incidents', language: 'en' },
  { id: '4', label: 'Why is BRK-1042 still pending?', category: 'incidents', language: 'en' },
  { id: '5', label: 'What happened with the last breakdown?', category: 'incidents', language: 'en' },
  { id: '6', label: 'TRK-104 reject kyun hua?', category: 'rules', language: 'hi' },
  { id: '7', label: 'Aaj kitne critical incidents hain?', category: 'incidents', language: 'hinglish' },
];

export function useVoiceAgent() {
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [mode, setMode] = useState<VoiceInteractionMode>('VOICE');
  const [language, setLanguage] = useState<SupportedLanguageCode>('auto');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    {
      id: 'welcome',
      speaker: 'agent',
      text: 'Grafity Voice is ready. Ask about breakdown incidents, vehicle eligibility, or dispatcher rules.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'grounded',
      citations: ['Fleet Master', 'Dispatcher Rules'],
    },
  ]);
  const [audioLevel, setAudioLevel] = useState(0.2);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [listeningSeconds, setListeningSeconds] = useState(0);
  const [thinkingStep, setThinkingStep] = useState<string>('Analyzing operations context...');

  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const thinkingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync language selection
  useEffect(() => {
    defaultVoiceService.setLanguage(language);
  }, [language]);

  // Check initial microphone permission state
  useEffect(() => {
    defaultVoiceService.checkMicrophonePermission().then((status) => {
      setPermissionState(status);
    });
  }, []);

  // Timer for listening state (e.g. 00:04)
  useEffect(() => {
    if (voiceState === 'LISTENING') {
      setListeningSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setListeningSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setListeningSeconds(0);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [voiceState]);

  // Thinking sub-steps cycle during PROCESSING
  useEffect(() => {
    if (voiceState === 'PROCESSING' || voiceState === 'GENERATING') {
      const steps = [
        'Finding relevant incident context...',
        'Checking decision records...',
        'Evaluating dispatcher rules...',
        'Formulating grounded answer...',
      ];
      let stepIdx = 0;
      setThinkingStep(steps[0]);

      thinkingIntervalRef.current = setInterval(() => {
        stepIdx = (stepIdx + 1) % steps.length;
        setThinkingStep(steps[stepIdx]);
      }, 1400);
    } else {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
      setThinkingStep('Analyzing operations context...');
    }

    return () => {
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    };
  }, [voiceState]);

  // Audio level animation loop when active
  useEffect(() => {
    if (voiceState === 'LISTENING' || voiceState === 'SPEAKING') {
      audioIntervalRef.current = setInterval(() => {
        setAudioLevel(0.25 + Math.random() * 0.75);
      }, 100);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setAudioLevel(0.12);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [voiceState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      defaultVoiceService.stopListening();
      defaultVoiceService.stopSpeaking();
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (thinkingIntervalRef.current) clearInterval(thinkingIntervalRef.current);
    };
  }, []);

  const speakResponse = useCallback(
    (text: string) => {
      if (isMuted) {
        setVoiceState('IDLE');
        return;
      }
      setVoiceState('SPEAKING');
      defaultVoiceService.speak(
        text,
        {},
        {
          onStart: () => setVoiceState('SPEAKING'),
          onEnd: () => setVoiceState('IDLE'),
          onError: () => setVoiceState('IDLE'),
        }
      );
    },
    [isMuted]
  );

  const processQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) return;

      const userItemId = `user-${Date.now()}`;
      const userItem: TranscriptItem = {
        id: userItemId,
        speaker: 'user',
        text: queryText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language,
      };

      setTranscripts((prev) => [...prev, userItem]);
      setCurrentTranscript('');
      setVoiceState('PROCESSING');
      setErrorMessage(null);

      try {
        const result: ChatQueryResponse = await defaultVoiceService.dispatchChatQuery(queryText);

        const agentItem: TranscriptItem = {
          id: `agent-${Date.now()}`,
          speaker: 'agent',
          text: result.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: result.status,
          citations: result.citations,
        };

        setTranscripts((prev) => [...prev, agentItem]);
        speakResponse(result.answer);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to connect to operations engine';
        setErrorMessage(msg);
        setVoiceState('ERROR');
      }
    },
    [language, speakResponse]
  );

  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    const granted = await defaultVoiceService.requestMicrophoneAccess();
    if (granted) {
      setPermissionState('granted');
      setShowPermissionPrompt(false);
      setErrorMessage(null);
      return true;
    } else {
      setPermissionState('denied');
      setShowPermissionPrompt(true);
      setErrorMessage('Microphone access is unavailable.');
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!isSpeechRecognitionSupported()) {
      setErrorMessage('Speech recognition is not supported in this browser.');
      setVoiceState('ERROR');
      setShowPermissionPrompt(true);
      return;
    }

    if (permissionState === 'denied') {
      setShowPermissionPrompt(true);
      return;
    }

    // Try to ensure permissions
    if (permissionState === 'prompt') {
      const granted = await defaultVoiceService.requestMicrophoneAccess();
      if (!granted) {
        setPermissionState('denied');
        setShowPermissionPrompt(true);
        setErrorMessage('Microphone access is required to speak.');
        return;
      }
      setPermissionState('granted');
    }

    try {
      defaultVoiceService.stopSpeaking();
      setErrorMessage(null);
      setShowPermissionPrompt(false);
      setVoiceState('LISTENING');
      setCurrentTranscript('');

      defaultVoiceService.startListening({
        onInterimResult: (transcript) => {
          setCurrentTranscript(transcript);
          setVoiceState('TRANSCRIBING');
        },
        onFinalResult: (result) => {
          setCurrentTranscript(result.text);
          processQuery(result.text);
        },
        onError: (err: VoiceError) => {
          if (err.type === 'PERMISSION_DENIED') {
            setPermissionState('denied');
            setShowPermissionPrompt(true);
          }
          setErrorMessage(err.message);
          setVoiceState(err.type === 'PERMISSION_DENIED' ? 'ERROR' : 'IDLE');
        },
        onEnd: () => {
          setVoiceState((prev) => (prev === 'LISTENING' || prev === 'TRANSCRIBING' ? 'IDLE' : prev));
        },
      });
    } catch {
      setVoiceState('IDLE');
    }
  }, [permissionState, processQuery]);

  const stopListening = useCallback(() => {
    defaultVoiceService.stopListening();
    defaultVoiceService.stopSpeaking();
    setVoiceState('IDLE');
  }, []);

  const pause = useCallback(() => {
    if (voiceState === 'LISTENING') {
      defaultVoiceService.stopListening();
      setVoiceState('IDLE');
    } else if (voiceState === 'SPEAKING') {
      defaultVoiceService.pauseSpeaking();
      setVoiceState('IDLE');
    }
  }, [voiceState]);

  const resume = useCallback(() => {
    defaultVoiceService.resumeSpeaking();
    setVoiceState('SPEAKING');
  }, []);

  const cancel = useCallback(() => {
    defaultVoiceService.abortListening();
    defaultVoiceService.stopSpeaking();
    setCurrentTranscript('');
    setVoiceState('IDLE');
    setErrorMessage(null);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) defaultVoiceService.stopSpeaking();
      return !prev;
    });
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscripts([]);
    setCurrentTranscript('');
  }, []);

  const copyTranscript = useCallback(() => {
    const fullText = transcripts
      .map((t) => `[${t.timestamp}] ${t.speaker.toUpperCase()}: ${t.text}`)
      .join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
    }
  }, [transcripts]);

  const replayLastResponse = useCallback(() => {
    const lastAgent = [...transcripts].reverse().find((t) => t.speaker === 'agent');
    if (lastAgent) {
      speakResponse(lastAgent.text);
    }
  }, [transcripts, speakResponse]);

  // Format seconds as mm:ss
  const formattedTimer = `${Math.floor(listeningSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(listeningSeconds % 60).toString().padStart(2, '0')}`;

  return {
    voiceState,
    mode,
    setMode,
    language,
    setLanguage,
    currentTranscript,
    transcripts,
    audioLevel,
    errorMessage,
    isMuted,
    permissionState,
    showPermissionPrompt,
    setShowPermissionPrompt,
    requestMicrophonePermission,
    listeningSeconds,
    formattedTimer,
    thinkingStep,
    startListening,
    stopListening,
    pause,
    resume,
    cancel,
    toggleMute,
    sendTextMessage: processQuery,
    clearTranscript,
    copyTranscript,
    replayLastResponse,
  };
}
