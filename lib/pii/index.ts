/**
 * PII Ingestion Boundary & Protection Engine
 */

export const REDACTED = '[REDACTED]';

const PHONE_REGEX = /(\+?\d{1,3}[\s\-]?)?(\(?\d{2,4}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{4}/g;
const AADHAAR_REGEX = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g;
const DL_REGEX = /\b[A-Z]{2}\d{2}[\s\-]?(?:19|20)\d{9,11}\b/gi;

const PII_FIELD_NAMES = new Set([
  'phone',
  'phone_number',
  'mobile',
  'contact_number',
  'dl_number',
  'dl',
  'driver_license',
  'licence_number',
  'license_number',
  'aadhaar',
  'aadhaar_number',
  'aadhar',
  'national_id',
  'government_id',
  'ssn',
]);

export interface MaskResult<T> {
  data: T;
  maskedCount: number;
}

export function maskTextPii(text: string): { maskedText: string; count: number } {
  if (!text || typeof text !== 'string') return { maskedText: text, count: 0 };

  let count = 0;
  let maskedText = text;

  maskedText = maskedText.replace(AADHAAR_REGEX, () => {
    count++;
    return REDACTED;
  });

  maskedText = maskedText.replace(DL_REGEX, () => {
    count++;
    return REDACTED;
  });

  maskedText = maskedText.replace(PHONE_REGEX, (match) => {
    const cleanDigits = match.replace(/\D/g, '');
    if (cleanDigits.length >= 10 && cleanDigits.length <= 13) {
      count++;
      return REDACTED;
    }
    return match;
  });

  return { maskedText, count };
}

export function maskPii<T>(input: T): MaskResult<T> {
  let maskedCount = 0;

  function deepMask(val: unknown, currentKey?: string): unknown {
    if (val === null || val === undefined) return val;

    if (currentKey && PII_FIELD_NAMES.has(currentKey.toLowerCase())) {
      maskedCount++;
      return REDACTED;
    }

    if (typeof val === 'string') {
      const { maskedText, count } = maskTextPii(val);
      maskedCount += count;
      return maskedText;
    }

    if (Array.isArray(val)) {
      return val.map((item) => deepMask(item));
    }

    if (typeof val === 'object') {
      const maskedObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (PII_FIELD_NAMES.has(k.toLowerCase())) {
          maskedCount++;
          maskedObj[k] = REDACTED;
        } else {
          maskedObj[k] = deepMask(v, k);
        }
      }
      return maskedObj;
    }

    return val;
  }

  const data = deepMask(input) as T;
  return { data, maskedCount };
}

export function hasRawPiiLeaks(input: unknown): boolean {
  const str = typeof input === 'string' ? input : JSON.stringify(input);

  const phoneMatch = str.match(/(\+?91[\s\-]?)?\b[6-9]\d{9}\b/);
  const aadhaarMatch = str.match(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/);
  const dlMatch = str.match(/\b[A-Z]{2}\d{2}[\s\-]?(?:19|20)\d{9}\b/);

  return !!(phoneMatch || aadhaarMatch || dlMatch);
}
