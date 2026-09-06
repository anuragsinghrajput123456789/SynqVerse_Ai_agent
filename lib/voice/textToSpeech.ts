/**
 * Browser-Native Text-to-Speech (TTS) Provider
 * Uses Web Speech Synthesis API with multilingual voice selection and playback controls.
 */

import { SpeechSynthesisOptions } from './types';

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Strips markdown and technical markup to produce natural-sounding speech text
 */
export function prepareTextForSpeech(markdownText: string): string {
  if (!markdownText || typeof markdownText !== 'string') return '';

  return markdownText
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold **text** -> text
    .replace(/\*(.*?)\*/g, '$1') // Italic *text* -> text
    .replace(/`([^`]+)`/g, '$1') // Code `text` -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Markdown link [text](url) -> text
    .replace(/🏷️|📜|✅|❌|⚠️|🔊|⏸|⏹/g, '') // Emojis
    .replace(/[-_]{3,}/g, ' ') // Horizontal rules
    .replace(/#+\s/g, '') // Headings
    .replace(/\s+/g, ' ')
    .trim();
}

export class BrowserSpeechSynthesisService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPausedState = false;

  public speak(
    text: string,
    options: SpeechSynthesisOptions = {},
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: Error) => void;
    }
  ): void {
    if (!isSpeechSynthesisSupported()) {
      callbacks?.onError?.(new Error('Speech synthesis is not supported in this browser.'));
      return;
    }

    // Stop any existing speech
    this.stop();

    const cleanText = prepareTextForSpeech(text);
    if (!cleanText) return;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.lang = options.lang ?? 'en-US';

      // Pick matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (options.voiceName) {
          const match = voices.find((v) => v.name.toLowerCase().includes(options.voiceName!.toLowerCase()));
          if (match) utterance.voice = match;
        } else if (options.lang) {
          const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(options.lang!.toLowerCase().slice(0, 2)));
          if (langMatch) utterance.voice = langMatch;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPausedState = false;
        callbacks?.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.isPausedState = false;
        this.currentUtterance = null;
        callbacks?.onEnd?.();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.isPausedState = false;
        this.currentUtterance = null;
        callbacks?.onError?.(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err: unknown) {
      this.isSpeaking = false;
      this.isPausedState = false;
      callbacks?.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  public pause(): void {
    if (isSpeechSynthesisSupported() && this.isSpeaking && !this.isPausedState) {
      window.speechSynthesis.pause();
      this.isPausedState = true;
    }
  }

  public resume(): void {
    if (isSpeechSynthesisSupported() && this.isPausedState) {
      window.speechSynthesis.resume();
      this.isPausedState = false;
    }
  }

  public stop(): void {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPausedState = false;
      this.currentUtterance = null;
    }
  }

  public getStatus(): { isSpeaking: boolean; isPaused: boolean } {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPausedState,
    };
  }
}
