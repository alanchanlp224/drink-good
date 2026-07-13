/** Resolve vintage vs wine-wide Vivino rating stats for display. */

import type { ScoreScope, VivinoVintageStats } from "./types.js";

export interface RawVivinoStatistics {
  ratings_average?: number;
  ratings_count?: number;
}

function hasDisplayableAverage(stats?: RawVivinoStatistics | null): boolean {
  return (stats?.ratings_average ?? 0) > 0;
}

/**
 * Prefer vintage-specific ratings; fall back to wine-wide (U.V.) average when
 * the vintage is below Vivino's display threshold (average 0, count may exist).
 */
export function resolveCandidateStats(
  vintageStats: RawVivinoStatistics,
  wineStats?: RawVivinoStatistics | null,
): VivinoVintageStats {
  if (hasDisplayableAverage(vintageStats)) {
    return {
      ratingsAverage: vintageStats.ratings_average ?? null,
      ratingsCount: vintageStats.ratings_count ?? null,
      scoreScope: "vintage" satisfies ScoreScope,
    };
  }

  if (hasDisplayableAverage(wineStats)) {
    return {
      ratingsAverage: wineStats?.ratings_average ?? null,
      ratingsCount: wineStats?.ratings_count ?? null,
      scoreScope: "all_vintages" satisfies ScoreScope,
    };
  }

  return {
    ratingsAverage: vintageStats.ratings_average ?? null,
    ratingsCount: vintageStats.ratings_count ?? null,
    scoreScope: "vintage" satisfies ScoreScope,
  };
}
