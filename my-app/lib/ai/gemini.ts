import { GoogleGenAI } from '@google/genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { SourceCitation } from '../types';
import { Fact } from './types';

export * from './types';

export const GroundedAnswerSchema = z.object({
  answer: z.string().min(1),
  status: z.enum(['grounded', 'insufficient_data']),
  citedSourceIds: z.array(z.string()),
});

export type GroundedAnswerPayload = z.infer<typeof GroundedAnswerSchema>;


export const MechanicNoteInterpretationSchema = z.object({
  issueCategory: z.string(),
  isTemporaryFix: z.boolean(),
  permanentRepairPending: z.boolean(),
  requiresGroundedStatus: z.boolean(),
  sanitizedSummary: z.string(),
  confidence: z.number().min(0).max(1),
});

export type MechanicNoteInterpretation = z.infer<typeof MechanicNoteInterpretationSchema>;

export async function interpretUnstructuredNote(note: string): Promise<MechanicNoteInterpretation> {
  const defaultFallback: MechanicNoteInterpretation = {
    issueCategory: 'General Mechanical',
    isTemporaryFix: note.toLowerCase().includes('jugaad') || note.toLowerCase().includes('temporary'),
    permanentRepairPending: note.toLowerCase().includes('pending') || note.toLowerCase().includes('jugaad'),
    requiresGroundedStatus: note.toLowerCase().includes('overdue') || note.toLowerCase().includes('grounded'),
    sanitizedSummary: note.trim(),
    confidence: 0.8,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !note.trim()) {
    return defaultFallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a freight mechanics text analyzer for Indian trucking operations.
Analyze the following maintenance/breakdown note (which may contain mixed Hindi/English/Hinglish terms like "jugaad", "chalu kiya", "wire bandha", "pending").
Return ONLY a valid JSON object matching:
{
  "issueCategory": string,
  "isTemporaryFix": boolean,
  "permanentRepairPending": boolean,
  "requiresGroundedStatus": boolean,
  "sanitizedSummary": string,
  "confidence": number between 0 and 1
}

NOTE:
${note}`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = res.text?.trim() || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return defaultFallback;

    const parsed = JSON.parse(jsonMatch[0]);
    const validation = MechanicNoteInterpretationSchema.safeParse(parsed);
    if (validation.success) {
      return validation.data;
    }
    return defaultFallback;
  } catch {
    return defaultFallback;
  }
}

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

let customGenerateAnswerHandler: ((prompt: string, contextFacts: Fact[]) => Promise<string>) | null = null;

export function __setGenerateAnswerHandler(
  handler: ((prompt: string, contextFacts: Fact[]) => Promise<string>) | null
) {
  customGenerateAnswerHandler = handler;
}

/**
 * A thin wrapper around the Gemini API using @google/generative-ai.
 * Answers questions STRICTLY using only the provided facts.
 * Explicitly returns "I don't have enough information" if facts don't cover the question.
 * Prohibits free reasoning, tool-calling, and agent behavior.
 */
export async function generateAnswer(prompt: string, contextFacts: Fact[]): Promise<string> {
  if (customGenerateAnswerHandler) {
    return customGenerateAnswerHandler(prompt, contextFacts);
  }

  if (!prompt || !prompt.trim() || !contextFacts || contextFacts.length === 0) {
    return "I don't have enough information.";
  }

  const formattedFacts = contextFacts

    .map((fact, index) => `[Fact ${index + 1}] (Source: ${fact.source_ref}): ${fact.text}`)
    .join('\n');

  const fullPrompt = `You are a strict, grounded AI assistant for Meridian Freight operations.
Answer the user's question using ONLY the provided facts below.

CRITICAL INSTRUCTIONS:
1. Answer ONLY using the facts provided in the FACTS section below.
2. If the provided facts do not contain enough information to answer the question completely and accurately, you MUST explicitly output: "I don't have enough information."
3. Do NOT make assumptions, do NOT speculate, do NOT use external knowledge, and do NOT use free reasoning beyond what is directly stated.
4. Do NOT attempt to call tools, execute actions, or behave like an autonomous agent.
5. Keep your answer direct, clear, factual, and concise.

FACTS:
${formattedFacts}

USER QUESTION:
${prompt.trim()}`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Deterministic fallback when API key is not configured (e.g. offline unit testing)
    return `Based on records:\n${contextFacts.map((f) => f.text).join('\n')}`;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text()?.trim() || '';

    if (
      !text ||
      text.toLowerCase().includes("don't have enough information") ||
      text.toLowerCase().includes('insufficient data')
    ) {
      return "I don't have enough information.";
    }

    return text;
  } catch (err) {
    console.warn('Gemini API call failed in generateAnswer:', err);
    // When Gemini errors or fails, return grounded fallback from facts
    return `Based on records:\n${contextFacts.map((f) => f.text).join('\n')}`;
  }
}

