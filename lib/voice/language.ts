/**
 * Multilingual Language Detection & Normalization Engine
 * Handles English, Hindi (Devanagari), and Hinglish (Romanized Hindi)
 * while strictly preserving operational IDs (TRK-104, BRK-1042, R-001, etc.).
 */

import { SupportedLanguageCode } from './types';

// Common Hinglish markers used in Indian freight & logistics operations
const HINGLISH_MARKERS = new Set([
  'kyun',
  'kyu',
  'kya',
  'kiya',
  'gaya',
  'hua',
  'hai',
  'hain',
  'ka',
  'ki',
  'ke',
  'ko',
  'se',
  'me',
  'mein',
  'par',
  'pe',
  'gaadi',
  'gadi',
  'truck',
  'batao',
  'dikhao',
  'chalega',
  'bhejo',
  'nikla',
  'pahucha',
  'wala',
  'wali',
  'kaise',
  'kaha',
  'kahan',
  'nahi',
  'nahin',
  'karo',
  'kharab',
  'jugaad',
]);

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

export function detectLanguage(text: string): SupportedLanguageCode {
  if (!text || typeof text !== 'string') return 'en-US';

  const clean = text.trim();

  // 1. Check for Devanagari Hindi characters
  if (DEVANAGARI_REGEX.test(clean)) {
    return 'hi-IN';
  }

  // 2. Check for Hinglish marker words
  const words = clean.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  let hinglishCount = 0;

  for (const w of words) {
    if (HINGLISH_MARKERS.has(w)) {
      hinglishCount++;
    }
  }

  if (hinglishCount >= 1 || (words.length > 0 && hinglishCount / words.length >= 0.2)) {
    return 'hinglish';
  }

  return 'en-US';
}

/**
 * Normalizes speech-to-text outputs to align with Meridian Freight entity conventions
 * (e.g. "TRK 104" -> "TRK-104", "TKT 0027" -> "TKT-0027", "DRV 20" -> "DRV-020", "R 001" -> "R-001")
 */
export function normalizeVoiceTranscription(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let normalized = rawText.trim();

  // Normalize "TRK 104" / "TRUCK 104" -> "TRK-104"
  normalized = normalized.replace(/\b(?:TRK|TRUCK)\s*([0-9]{1,4})\b/gi, (_, num) => {
    return `TRK-${num.padStart(3, '0')}`;
  });

  // Normalize "MF 068" / "MF 41" -> "MF-068"
  normalized = normalized.replace(/\bMF\s*([0-9]{1,3})\b/gi, (_, num) => {
    return `MF-${num.padStart(3, '0')}`;
  });

  // Normalize "TKT 27" / "TKT 0027" / "BRK 1042" -> "TKT-0027" / "BRK-1042"
  normalized = normalized.replace(/\b(TKT|BRK)\s*([0-9]{1,5})\b/gi, (_, prefix, num) => {
    return `${prefix.toUpperCase()}-${num.padStart(4, '0')}`;
  });

  // Normalize "DRV 20" / "DRIVER 20" -> "DRV-020"
  normalized = normalized.replace(/\b(?:DRV|DRIVER)\s*([0-9]{1,3})\b/gi, (_, num) => {
    return `DRV-${num.padStart(3, '0')}`;
  });

  // Normalize "Rule 001" / "Rule 1" / "R 001" -> "R-001"
  normalized = normalized.replace(/\b(?:Rule|R)\s*([0-9]{1,3})\b/gi, (_, num) => {
    return `R-${num.padStart(3, '0')}`;
  });

  return normalized;
}

export function getTtsLanguage(langCode: SupportedLanguageCode): string {
  switch (langCode) {
    case 'hi-IN':
      return 'hi-IN';
    case 'hinglish':
      return 'en-IN';
    case 'en-US':
    default:
      return 'en-US';
  }
}
