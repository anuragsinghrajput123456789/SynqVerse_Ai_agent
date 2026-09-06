/**
 * Browser-Native Speech-to-Text Provider & Provider Abstraction
 * Uses Web Speech API with interim transcripts, language detection, and automatic PII sanitization.
 */

import { detectLanguage, normalizeVoiceTranscription } from './language';
import { maskTextPii } from '../pii';
import { SupportedLanguageCode, VoiceError, VoiceTranscriptionResult } from './types';

// Browser Web Speech API type definitions for TypeScript
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface ISpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export interface SpeechRecognitionCallbacks {
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (result: VoiceTranscriptionResult) => void;
  onError?: (error: VoiceError) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export class BrowserSpeechRecognitionService {
  private recognition: ISpeechRecognitionInstance | null = null;
  private isListening = false;
  private selectedLanguage: SupportedLanguageCode = 'auto';

  constructor() {
    if (isSpeechRecognitionSupported()) {
      const RecognitionConstructor = (window as unknown as Record<string, new () => ISpeechRecognitionInstance>)[
        'SpeechRecognition'
      ] ||
      (window as unknown as Record<string, new () => ISpeechRecognitionInstance>)[
        'webkitSpeechRecognition'
      ];
      if (RecognitionConstructor) {
        this.recognition = new RecognitionConstructor();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  public setLanguage(lang: SupportedLanguageCode) {
    this.selectedLanguage = lang;
    if (this.recognition) {
      switch (lang) {
        case 'hi-IN':
          this.recognition.lang = 'hi-IN';
          break;
        case 'hinglish':
          this.recognition.lang = 'en-IN';
          break;
        case 'en-US':
        case 'auto':
        default:
          this.recognition.lang = 'en-US';
          break;
      }
    }
  }

  public startListening(callbacks: SpeechRecognitionCallbacks): void {
    if (!this.recognition) {
      callbacks.onError?.({
        type: 'NOT_SUPPORTED',
        message: 'Voice input is not supported in this browser. Please use keyboard input.',
        recoverable: false,
      });
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    let finalTranscript = '';

    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript && callbacks.onInterimResult) {
        callbacks.onInterimResult(interimTranscript);
      }

      if (finalTranscript) {
        const normalized = normalizeVoiceTranscription(finalTranscript);
        const { maskedText, count } = maskTextPii(normalized);
        const detected = this.selectedLanguage === 'auto' ? detectLanguage(normalized) : this.selectedLanguage;

        callbacks.onFinalResult?.({
          text: maskedText,
          detectedLanguage: detected,
          confidence: 0.95,
          isFinal: true,
          rawPiiMasked: count > 0,
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      let errorType: VoiceError['type'] = 'UNKNOWN';
      let message = 'An unexpected error occurred during speech recognition.';

      if (event.error === 'not-allowed') {
        errorType = 'PERMISSION_DENIED';
        message = 'Microphone permission was denied. Please allow microphone access to speak.';
      } else if (event.error === 'no-speech') {
        errorType = 'NO_SPEECH';
        message = 'No speech detected. Please speak clearly into the microphone.';
      } else if (event.error === 'audio-capture') {
        errorType = 'AUDIO_CAPTURE_FAILED';
        message = 'No microphone was found or microphone is in use by another application.';
      } else if (event.error === 'network') {
        errorType = 'NETWORK_ERROR';
        message = 'Network error occurred during speech recognition.';
      }

      callbacks.onError?.({
        type: errorType,
        message,
        recoverable: true,
      });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      callbacks.onError?.({
        type: 'UNKNOWN',
        message: 'Could not start microphone recording.',
        recoverable: true,
      });
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
      this.isListening = false;
    }
  }

  public abort(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch (err) {
        console.warn('Error aborting speech recognition:', err);
      }
      this.isListening = false;
    }
  }
}
