/** B+C match strategy: vintage gate + composite name-similarity confidence. */

import { getLogger } from "../core/logger.js";
import {
  hasNonVintageMarker,
  normalizeForMatch,
  scoreNameMatch,
  type MatchScoreBreakdown,
} from "./similarity.js";
import type {
  NormalizedQuery,
  VivinoMatchResult,
  VivinoMatcherConfig,
  VivinoSearchCandidate,
} from "./types.js";

export const DEFAULT_VINTAGE_MATCH_THRESHOLD = 0.55;
export const DEFAULT_NAME_ONLY_THRESHOLD = 0.72;
/** Scores within this band use tie-breakers (Phase C). */
export const MATCH_SCORE_TIE_EPSILON = 0.05;

export interface ScoredCandidate {
  candidate: VivinoSearchCandidate;
  breakdown: MatchScoreBreakdown;
}

export function buildNormalizedQuery(rawTitle: string): NormalizedQuery {
  const rawNormalized = rawTitle.trim().replace(/\s+/g, " ");
  const vintage =
    rawNormalized.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
  const searchText = normalizeForMatch(rawNormalized);

  return {
    searchText,
    vintage: vintage ? Number.parseInt(vintage, 10) : null,
    rawNormalized,
    nonVintage: vintage === null && hasNonVintageMarker(rawNormalized),
  };
}

function scoreCandidateName(
  queryForMatch: string,
  candidate: VivinoSearchCandidate,
): MatchScoreBreakdown {
  const primary = scoreNameMatch(queryForMatch, candidate.matchedName);
  if (!candidate.winery) {
    return primary;
  }

  const withWinery = scoreNameMatch(
    queryForMatch,
    `${candidate.winery} ${candidate.matchedName}`,
  );

  return withWinery.composite > primary.composite ? withWinery : primary;
}

/** Phase C tie-breakers when composite scores are close. */
export function compareScoredCandidates(
  left: ScoredCandidate,
  right: ScoredCandidate,
  epsilon: number = MATCH_SCORE_TIE_EPSILON,
  preferNonVintage: boolean = false,
): number {
  const scoreDelta = right.breakdown.composite - left.breakdown.composite;
  if (Math.abs(scoreDelta) > epsilon) {
    return scoreDelta;
  }

  if (preferNonVintage) {
    const leftNonVintage = left.candidate.vintage === null ? 1 : 0;
    const rightNonVintage = right.candidate.vintage === null ? 1 : 0;
    if (leftNonVintage !== rightNonVintage) {
      return rightNonVintage - leftNonVintage;
    }
  }

  if (
    left.breakdown.substringBoost >= 0.92 &&
    right.breakdown.substringBoost >= 0.92
  ) {
    const countDelta =
      (right.candidate.stats.ratingsCount ?? 0) -
      (left.candidate.stats.ratingsCount ?? 0);
    if (countDelta !== 0) {
      return countDelta;
    }
  }

  const distinctiveDelta =
    right.breakdown.distinctiveRecall - left.breakdown.distinctiveRecall;
  if (distinctiveDelta !== 0) {
    return distinctiveDelta;
  }

  const recallDelta = right.breakdown.tokenRecall - left.breakdown.tokenRecall;
  if (recallDelta !== 0) {
    return recallDelta;
  }

  const ratingDelta =
    (right.candidate.stats.ratingsAverage ?? 0) -
    (left.candidate.stats.ratingsAverage ?? 0);
  if (ratingDelta !== 0) {
    return ratingDelta;
  }

  const countDelta =
    (right.candidate.stats.ratingsCount ?? 0) -
    (left.candidate.stats.ratingsCount ?? 0);
  if (countDelta !== 0) {
    return countDelta;
  }

  const extraDelta =
    left.breakdown.extraDistinctiveTokens - right.breakdown.extraDistinctiveTokens;
  if (extraDelta !== 0) {
    return extraDelta;
  }

  const precisionDelta =
    right.breakdown.tokenPrecision - left.breakdown.tokenPrecision;
  if (precisionDelta !== 0) {
    return precisionDelta;
  }

  return 0;
}

function hasPositiveRating(candidate: VivinoSearchCandidate): boolean {
  return (
    candidate.stats.ratingsAverage !== null && candidate.stats.ratingsAverage > 0
  );
}

/** Prefer rated wines when substring-boost ties would pick a 0-score sibling. */
function preferRatedAmongTied(
  scored: ScoredCandidate[],
  preferNonVintage: boolean,
): ScoredCandidate[] {
  if (scored.length <= 1) {
    return scored;
  }

  const topComposite = scored[0].breakdown.composite;
  let tieEnd = 1;
  while (
    tieEnd < scored.length &&
    Math.abs(scored[tieEnd].breakdown.composite - topComposite) <=
      MATCH_SCORE_TIE_EPSILON
  ) {
    tieEnd += 1;
  }

  if (tieEnd <= 1) {
    return scored;
  }

  const tied = scored.slice(0, tieEnd);
  const rest = scored.slice(tieEnd);
  const rated = tied.filter((entry) => hasPositiveRating(entry.candidate));
  if (rated.length === 0 || rated.length === tied.length) {
    return scored;
  }

  const unrated = tied.filter((entry) => !hasPositiveRating(entry.candidate));
  const compare = (left: ScoredCandidate, right: ScoredCandidate): number =>
    compareScoredCandidates(left, right, MATCH_SCORE_TIE_EPSILON, preferNonVintage);

  return [...rated.sort(compare), ...unrated.sort(compare), ...rest];
}

function logRankedCandidates(
  query: NormalizedQuery,
  ranked: ScoredCandidate[],
): void {
  if (ranked.length === 0) {
    return;
  }

  const lines = ranked.slice(0, 6).map(({ candidate, breakdown }) => {
    const rating = candidate.stats.ratingsAverage;
    const ratingLabel =
      rating !== null && rating > 0 ? rating.toFixed(1) : "n/a";
    return `${breakdown.composite.toFixed(3)} ★${ratingLabel} +${breakdown.extraDistinctiveTokens}extra ${candidate.matchedName}`;
  });

  getLogger().debug(
    `Matcher "${query.rawNormalized}" ranked: ${lines.join(" | ")}`,
  );
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
  const scored: ScoredCandidate[] = [];

  for (const candidate of candidates) {
    if (query.vintage !== null && candidate.vintage !== query.vintage) {
      continue;
    }

    scored.push({
      candidate,
      breakdown: scoreCandidateName(queryForMatch, candidate),
    });
  }

  if (scored.length === 0) {
    return {
      status: "no_match",
      reason:
        query.vintage !== null
          ? `No Vivino result with vintage ${query.vintage}`
          : "No Vivino candidates returned",
      bestConfidence: null,
    };
  }

  scored.sort((left, right) =>
    compareScoredCandidates(left, right, MATCH_SCORE_TIE_EPSILON, query.nonVintage),
  );
  const ranked = preferRatedAmongTied(scored, query.nonVintage);
  logRankedCandidates(query, ranked);

  const best = ranked[0];

  if (best.breakdown.composite < threshold) {
    return {
      status: "no_match",
      reason: `Best match confidence ${best.breakdown.composite.toFixed(2)} below threshold ${threshold}`,
      bestConfidence: best.breakdown.composite,
    };
  }

  return {
    status: "matched",
    candidate: best.candidate,
    confidence: best.breakdown.composite,
  };
}
