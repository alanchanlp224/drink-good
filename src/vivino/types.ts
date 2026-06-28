/** Shared Vivino domain types for search and matching. */

export interface NormalizedQuery {
  /** Wine name text used for Vivino search (vintage stripped when present). */
  searchText: string;
  /** Four-digit vintage when known. */
  vintage: number | null;
  /** Original normalized full title for logging. */
  rawNormalized: string;
}

export interface VivinoVintageStats {
  ratingsAverage: number | null;
  ratingsCount: number | null;
}

export interface VivinoSearchCandidate {
  wineId: number;
  vintageId: number;
  matchedName: string;
  vintage: number | null;
  stats: VivinoVintageStats;
  vivinoUrl: string;
  winery: string | null;
  source: "algolia" | "explore";
}

export type VivinoMatchResult =
  | {
      status: "matched";
      candidate: VivinoSearchCandidate;
      confidence: number;
    }
  | {
      status: "no_match";
      reason: string;
      bestConfidence: number | null;
    };

export interface VivinoClientConfig {
  baseUrl?: string;
  countryCode?: string;
  currencyCode?: string;
  userAgent?: string;
  minRequestIntervalMs?: number;
  maxRetries?: number;
  algoliaAppId?: string;
  algoliaApiKey?: string;
  algoliaIndex?: string;
  fetchFn?: typeof fetch;
}

export interface VivinoMatcherConfig {
  /** Minimum name-similarity score (0–1) when vintage matches. */
  vintageMatchThreshold?: number;
  /** Stricter threshold when query has no vintage year. */
  nameOnlyThreshold?: number;
  maxCandidates?: number;
}
