/** String normalization and fuzzy name comparison for Vivino matching. */

const VINTAGE_PATTERN = /\b(19|20)\d{2}\b/;

/** Strip accents and lower-case for comparison. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Extract a four-digit vintage year from free text. */
export function extractVintage(value: string): number | null {
  const match = value.match(VINTAGE_PATTERN);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[0], 10);
}

/** Remove vintage year tokens from a wine title. */
export function stripVintage(value: string): string {
  return value.replace(VINTAGE_PATTERN, " ").replace(/\s+/g, " ").trim();
}

const STOP_TOKENS = new Set([
  "de",
  "du",
  "la",
  "le",
  "les",
  "des",
  "the",
  "and",
  "et",
  "of",
  "a",
]);

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_TOKENS.has(token));
}

/**
 * Token-overlap similarity with prefix bonus.
 * Handles "Chateau Lynch Bages" vs "Château Lynch-Bages Pauillac (Grand Cru Classé)".
 */
export function nameSimilarity(query: string, candidate: string): number {
  const queryNorm = normalizeText(stripVintage(query));
  const candidateNorm = normalizeText(stripVintage(candidate));

  if (!queryNorm || !candidateNorm) {
    return 0;
  }

  if (queryNorm === candidateNorm) {
    return 1;
  }

  if (candidateNorm.includes(queryNorm) || queryNorm.includes(candidateNorm)) {
    return 0.92;
  }

  const queryTokens = tokenize(queryNorm);
  const candidateTokens = new Set(tokenize(candidateNorm));

  if (queryTokens.length === 0 || candidateTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  let missing = 0;
  for (const token of queryTokens) {
    if (candidateTokens.has(token)) {
      overlap += 1;
      continue;
    }
    let partial = false;
    for (const candidateToken of candidateTokens) {
      if (
        candidateToken.startsWith(token) ||
        token.startsWith(candidateToken)
      ) {
        overlap += 0.7;
        partial = true;
        break;
      }
    }
    if (!partial) {
      missing += 1;
    }
  }

  if (missing > 0) {
    // Query tokens absent from candidate (e.g. "lynch" missing on Haut-Bages).
    const missingPenalty = missing / queryTokens.length;
    if (missingPenalty >= 0.34) {
      return 0;
    }
  }

  const recall = overlap / queryTokens.length;
  const precision = overlap / candidateTokens.size;
  if (recall === 0) {
    return 0;
  }

  return Math.min(1, recall * 0.75 + precision * 0.25);
}

/** Vivino displays ratings on a 5-point scale; extension shows one decimal. */
export function formatVivinoScore(rating: number | null): string | null {
  if (rating === null || Number.isNaN(rating) || rating <= 0) {
    return null;
  }
  return rating.toFixed(1);
}
