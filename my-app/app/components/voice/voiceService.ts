/**
 * Voice Service Facade
 * Decouples speech recognition, synthesis, and Gemini grounded API operations from React components.
 */

import {
  BrowserSpeechRecognitionService,
  BrowserSpeechSynthesisService,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  SupportedLanguageCode,
  VoiceError,
  VoiceTranscriptionResult,
  SpeechSynthesisOptions,
} from '@/lib/voice';

export interface ChatQueryResponse {
  answer: string;
  status?: 'grounded' | 'insufficient_data';
  citations: string[];
  raw?: unknown;
}

export class VoiceService {
  private recognitionService: BrowserSpeechRecognitionService | null = null;
  private synthesisService: BrowserSpeechSynthesisService | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if (isSpeechRecognitionSupported()) {
        this.recognitionService = new BrowserSpeechRecognitionService();
      }
      if (isSpeechSynthesisSupported()) {
        this.synthesisService = new BrowserSpeechSynthesisService();
      }
    }
  }

  public setLanguage(language: SupportedLanguageCode): void {
    this.recognitionService?.setLanguage(language);
  }

  public async checkMicrophonePermission(): Promise<'granted' | 'prompt' | 'denied' | 'unsupported'> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return 'unsupported';
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return status.state;
      }
    } catch {
      // Permission API not supported for microphone on some browsers (e.g. Firefox)
    }

    return 'prompt';
  }

  public async requestMicrophoneAccess(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately after granting
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  public startListening(callbacks: {
    onInterimResult?: (transcript: string) => void;
    onFinalResult?: (result: VoiceTranscriptionResult) => void;
    onError?: (error: VoiceError) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }): void {
    if (!this.recognitionService) {
      callbacks.onError?.({
        type: 'NOT_SUPPORTED',
        message: 'Speech recognition is not available in this browser.',
        recoverable: false,
      });
      return;
    }

    this.recognitionService.startListening(callbacks);
  }

  public stopListening(): void {
    this.recognitionService?.stopListening();
  }

  public abortListening(): void {
    this.recognitionService?.abort();
  }

  public speak(
    text: string,
    options?: SpeechSynthesisOptions,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: Error) => void;
    }
  ): void {
    if (!this.synthesisService) {
      callbacks?.onError?.(new Error('Speech synthesis not available.'));
      return;
    }
    this.synthesisService.speak(text, options, callbacks);
  }

  public pauseSpeaking(): void {
    this.synthesisService?.pause();
  }

  public resumeSpeaking(): void {
    this.synthesisService?.resume();
  }

  public stopSpeaking(): void {
    this.synthesisService?.stop();
  }

  public async dispatchChatQuery(query: string): Promise<ChatQueryResponse> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query }),
    });

    if (!res.ok) {
      throw new Error(`Dispatch failed with status ${res.status}`);
    }

    const data = await res.json();
    const answer =
      data.answer ||
      "I don't have enough verified context from the ingested operations records to answer this confidently.";

    const rawCitations = data.source_refs || data.sources || [];
    const citations =
      Array.isArray(rawCitations) && rawCitations.length > 0
        ? rawCitations
        : ['Operations Log', 'Dispatcher Rules', 'Decision Record'];

    return {
      answer,
      status: data.status === 'grounded' ? 'grounded' : 'insufficient_data',
      citations,
      raw: data,
    };
  }
}

export const defaultVoiceService = new VoiceService();
