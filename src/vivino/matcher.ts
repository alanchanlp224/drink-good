/** B+C match strategy: vintage gate + name-similarity confidence. */

import { nameSimilarity, normalizeForMatch } from "./similarity.js";
import type {
  NormalizedQuery,
  VivinoMatchResult,
  VivinoMatcherConfig,
  VivinoSearchCandidate,
} from "./types.js";

export const DEFAULT_VINTAGE_MATCH_THRESHOLD = 0.55;
export const DEFAULT_NAME_ONLY_THRESHOLD = 0.72;

export function buildNormalizedQuery(rawTitle: string): NormalizedQuery {
  const rawNormalized = rawTitle.trim().replace(/\s+/g, " ");
  const vintage =
    rawNormalized.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
  const searchText = normalizeForMatch(rawNormalized);

  return {
    searchText,
    vintage: vintage ? Number.parseInt(vintage, 10) : null,
    rawNormalized,
  };
}

export function pickBestMatch(
  query: NormalizedQuery,
  candidates: VivinoSearchCandidate[],
  config: VivinoMatcherConfig = {},
): VivinoMatchResult {
  const vintageThreshold =
    config.vintageMatchThreshold ?? DEFAULT_VINTAGE_MATCH_THRESHOLD;
  const nameOnlyThreshold =
    config.nameOnlyThreshold ?? DEFAULT_NAME_ONLY_THRESHOLD;
  const threshold =
    query.vintage !== null ? vintageThreshold : nameOnlyThreshold;

  const queryForMatch = query.rawNormalized;
  let best: { candidate: VivinoSearchCandidate; confidence: number } | null =
    null;

  for (const candidate of candidates) {
    if (query.vintage !== null) {
      if (candidate.vintage !== query.vintage) {
        continue;
      }
    }

    const confidence = nameSimilarity(queryForMatch, candidate.matchedName);
    if (!best || confidence > best.confidence) {
      best = { candidate, confidence };
    }
  }

  if (!best) {
    return {
      status: "no_match",
      reason:
        query.vintage !== null
          ? `No Vivino result with vintage ${query.vintage}`
          : "No Vivino candidates returned",
      bestConfidence: null,
    };
  }

  if (best.confidence < threshold) {
    return {
      status: "no_match",
      reason: `Best match confidence ${best.confidence.toFixed(2)} below threshold ${threshold}`,
      bestConfidence: best.confidence,
    };
  }

  return {
    status: "matched",
    candidate: best.candidate,
    confidence: best.confidence,
  };
}
