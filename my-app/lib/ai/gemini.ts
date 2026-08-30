/**
 * Gemini AI Integration & Response Validation Service
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { SourceCitation } from '../types';

export const GroundedAnswerSchema = z.object({
  answer: z.string().min(1),
  status: z.enum(['grounded', 'insufficient_data']),
  citedSourceIds: z.array(z.string()),
});

export type GroundedAnswerPayload = z.infer<typeof GroundedAnswerSchema>;

export async function generateValidatedGroundedAnswer(
  question: string,
  contextEvidence: string,
  availableCitations: SourceCitation[]
): Promise<{ answer: string; status: 'grounded' | 'insufficient_data'; validCitations: SourceCitation[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a strict, grounded AI assistant for Meridian Freight.
Answer the user's question using ONLY the provided evidence below.
Do NOT guess or add external knowledge.
Return your response ONLY as a JSON object with keys:
- "answer": string summary of the grounded answer
- "status": "grounded" OR "insufficient_data"
- "citedSourceIds": array of source IDs from the evidence used

EVIDENCE:
${contextEvidence}

AVAILABLE SOURCE IDS:
${availableCitations.map((c) => c.sourceId).join(', ')}

USER QUESTION:
${question}`;

  let responseText = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      responseText = res.text?.trim() || '';
      if (responseText) break;
    } catch (err: unknown) {
      if (attempt === 2) throw err;
    }
  }

  if (!responseText) {
    return {
      answer: 'Insufficient data to determine this.',
      status: 'insufficient_data',
      validCitations: [],
    };
  }

  let parsedJson: unknown = null;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedJson = JSON.parse(jsonMatch[0]);
    } else {
      parsedJson = JSON.parse(responseText);
    }
  } catch {
    if (responseText.toLowerCase().includes('insufficient data')) {
      return {
        answer: 'Insufficient data to determine this.',
        status: 'insufficient_data',
        validCitations: [],
      };
    }
    return {
      answer: responseText,
      status: 'grounded',
      validCitations: availableCitations,
    };
  }

  const validation = GroundedAnswerSchema.safeParse(parsedJson);
  if (!validation.success) {
    return {
      answer: 'Insufficient data to determine this.',
      status: 'insufficient_data',
      validCitations: [],
    };
  }

  const data = validation.data;
  if (data.status === 'insufficient_data') {
    return {
      answer: 'Insufficient data to determine this.',
      status: 'insufficient_data',
      validCitations: [],
    };
  }

  const validCitations = availableCitations.filter((c) => data.citedSourceIds.includes(c.sourceId));

  return {
    answer: data.answer,
    status: 'grounded',
    validCitations: validCitations.length > 0 ? validCitations : availableCitations,
  };
}
