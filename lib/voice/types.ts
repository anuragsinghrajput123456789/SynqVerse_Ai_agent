/**
 * Multilingual Voice Integration - Types & State Definitions
 */

export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'TRANSCRIBING'
  | 'GENERATING'
  | 'SPEAKING'
  | 'ERROR';

export type SupportedLanguageCode = 'en-US' | 'hi-IN' | 'hinglish' | 'auto';

export interface LanguageOption {
  code: SupportedLanguageCode;
  label: string;
  nativeLabel: string;
  speechRecognitionLang: string; // e.g. 'en-US' or 'hi-IN'
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'auto',
    label: 'Auto Detect',
    nativeLabel: 'Auto (English / हिंदी / Hinglish)',
    speechRecognitionLang: 'en-US',
  },
  {
    code: 'en-US',
    label: 'English',
    nativeLabel: 'English (India/US)',
    speechRecognitionLang: 'en-US',
  },
  {
    code: 'hi-IN',
    label: 'Hindi',
    nativeLabel: 'हिंदी (Hindi)',
    speechRecognitionLang: 'hi-IN',
  },
  {
    code: 'hinglish',
    label: 'Hinglish',
    nativeLabel: 'Hinglish (Hindi in English script)',
    speechRecognitionLang: 'en-IN',
  },
];

export interface VoiceTranscriptionResult {
  text: string;
  detectedLanguage: SupportedLanguageCode;
  confidence: number;
  isFinal: boolean;
  rawPiiMasked: boolean;
}

export interface SpeechSynthesisOptions {
  rate?: number; // 0.8 - 1.2 (default: 1.0)
  pitch?: number; // 0.8 - 1.2 (default: 1.0)
  lang?: string;
  voiceName?: string;
}

export type VoiceErrorType =
  | 'PERMISSION_DENIED'
  | 'NOT_SUPPORTED'
  | 'NO_SPEECH'
  | 'AUDIO_CAPTURE_FAILED'
  | 'NETWORK_ERROR'
  | 'LANGUAGE_NOT_SUPPORTED'
  | 'TTS_UNAVAILABLE'
  | 'UNKNOWN';

export interface VoiceError {
  type: VoiceErrorType;
  message: string;
  recoverable: boolean;
}
