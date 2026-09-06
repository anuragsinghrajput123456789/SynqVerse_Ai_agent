/**
 * Context Ranking & Precedence Evaluation Engine for Operations Copilot
 * Orders retrieved evidence by strict 5-tier source authority and manages token budgets.
 */

import type { RankedContext, RetrievedContext } from './types';

const MAX_EVIDENCE_CHAR_BUDGET = 8000;

export function rankAndOrganizeContext(retrieved: RetrievedContext): RankedContext {
  const { evidenceStatements, citations, conflicts } = retrieved;

  // 1. Sort Citations by Precedence (1 is highest authority)
  const rankedCitations = [...citations].sort((a, b) => {
    if (a.precedence !== b.precedence) {
      return a.precedence - b.precedence;
    }
    return a.title.localeCompare(b.title);
  });

  // 2. Format Conflict Explanations
  const explanations: string[] = [];
  for (const c of conflicts) {
    explanations.push(
      `Conflict for ${c.entityType} ${c.entityId} [Field: ${c.field}]: Winning source '${c.winningSource}' reported '${c.winningValue}', whereas rejected source '${c.rejectedSource}' reported '${c.rejectedValue}'. Resolution: ${c.reason} (enforced by 5-tier source precedence).`
    );
  }

  // 3. Assemble Grounded Evidence within bounded character budget
  const evidenceLines: string[] = [];

  // Add conflict explanations first if present
  if (explanations.length > 0) {
    evidenceLines.push('--- RECOGNIZED SOURCE CONFLICTS & PRECEDENCE RESOLUTIONS ---');
    for (const exp of explanations) {
      evidenceLines.push(exp);
    }
    evidenceLines.push('');
  }

  evidenceLines.push('--- GROUNDED OPERATIONAL RECORDS ---');
  let currentLength = evidenceLines.join('\n').length;

  for (const stmt of evidenceStatements) {
    if (currentLength + stmt.length + 1 > MAX_EVIDENCE_CHAR_BUDGET) {
      evidenceLines.push('... [Additional low-precedence context truncated to fit operational token budget]');
      break;
    }
    evidenceLines.push(stmt);
    currentLength += stmt.length + 1;
  }

  const groundedEvidence = evidenceLines.join('\n').trim();

  return {
    groundedEvidence,
    rankedCitations,
    conflicts,
    explanations,
  };
}
