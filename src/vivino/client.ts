/** Unified Vivino search client with session cache and rate limiting. */

import { searchAlgolia } from "./algolia.js";
import { searchExplore } from "./explore.js";
import { RateLimiter } from "./http.js";
import { buildNormalizedQuery, pickBestMatch } from "./matcher.js";
import type {
  NormalizedQuery,
  VivinoClientConfig,
  VivinoMatchResult,
  VivinoMatcherConfig,
  VivinoSearchCandidate,
} from "./types.js";
import { enrichCandidateStats } from "./vintage.js";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export class VivinoClient {
  private readonly config: Required<
    Pick<
      VivinoClientConfig,
      | "baseUrl"
      | "countryCode"
      | "currencyCode"
      | "userAgent"
      | "minRequestIntervalMs"
      | "maxRetries"
      | "algoliaAppId"
      | "algoliaApiKey"
      | "algoliaIndex"
    >
  > & { fetchFn: typeof fetch };

  private readonly rateLimiter: RateLimiter;
  private readonly sessionCache = new Map<string, VivinoMatchResult>();

  constructor(config: VivinoClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? "https://www.vivino.com",
      countryCode: config.countryCode ?? "hk",
      currencyCode: config.currencyCode ?? "HKD",
      userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
      minRequestIntervalMs: config.minRequestIntervalMs ?? 500,
      maxRetries: config.maxRetries ?? 3,
      algoliaAppId: config.algoliaAppId ?? "9TAKGWJUXL",
      algoliaApiKey:
        config.algoliaApiKey ?? "60c11b2f1068885161d95ca068d3a6ae",
      algoliaIndex: config.algoliaIndex ?? "WINES_prod",
      fetchFn: config.fetchFn ?? fetch,
    };
    this.rateLimiter = new RateLimiter(this.config.minRequestIntervalMs);
  }

  /** Clear session cache (popup Debug action). */
  clearCache(): void {
    this.sessionCache.clear();
  }

  cacheSize(): number {
    return this.sessionCache.size;
  }

  private cacheKey(query: NormalizedQuery): string {
    return `${query.searchText}|${query.vintage ?? "nv"}`;
  }

  /**
   * Search Vivino for a wine title and return the best B+C match.
   * Uses Algolia (full catalog) then explore (HK marketplace) as fallback.
   */
  async searchWine(
    rawTitle: string,
    matcherConfig: VivinoMatcherConfig = {},
  ): Promise<VivinoMatchResult> {
    const query = buildNormalizedQuery(rawTitle);
    const key = this.cacheKey(query);

    const cached = this.sessionCache.get(key);
    if (cached) {
      return cached;
    }

    const candidates = await this.fetchCandidates(query);
    let result = pickBestMatch(query, candidates, matcherConfig);

    if (result.status === "matched") {
      const enriched = await enrichCandidateStats(result.candidate, {
        baseUrl: this.config.baseUrl,
        userAgent: this.config.userAgent,
        fetchFn: this.config.fetchFn,
        rateLimiter: this.rateLimiter,
        maxRetries: this.config.maxRetries,
      });
      result = { ...result, candidate: enriched };
    }

    this.sessionCache.set(key, result);
    return result;
  }

  /** Expose candidate gathering for tests and debugging. */
  async fetchCandidates(
    query: NormalizedQuery,
  ): Promise<VivinoSearchCandidate[]> {
    const requestOptions = {
      baseUrl: this.config.baseUrl,
      userAgent: this.config.userAgent,
      fetchFn: this.config.fetchFn,
      rateLimiter: this.rateLimiter,
      maxRetries: this.config.maxRetries,
      targetVintage: query.vintage,
    };

    const algoliaCandidates = await searchAlgolia(query.searchText, {
      ...requestOptions,
      appId: this.config.algoliaAppId,
      apiKey: this.config.algoliaApiKey,
      index: this.config.algoliaIndex,
      hitsPerPage: matcherConfigLimit(),
    });

    if (algoliaCandidates.length > 0) {
      return dedupeCandidates(algoliaCandidates);
    }

    const exploreCandidates = await searchExplore(query.searchText, {
      baseUrl: this.config.baseUrl,
      userAgent: this.config.userAgent,
      fetchFn: this.config.fetchFn,
      rateLimiter: this.rateLimiter,
      maxRetries: this.config.maxRetries,
      vintage: query.vintage,
      countryCode: this.config.countryCode,
      currencyCode: this.config.currencyCode,
    });

    return dedupeCandidates(exploreCandidates);
  }
}

function matcherConfigLimit(): number {
  return 15;
}

function dedupeCandidates(
  candidates: VivinoSearchCandidate[],
): VivinoSearchCandidate[] {
  const seen = new Set<number>();
  const unique: VivinoSearchCandidate[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.vintageId)) {
      continue;
    }
    seen.add(candidate.vintageId);
    unique.push(candidate);
  }
  return unique;
}

export {
  DEFAULT_NAME_ONLY_THRESHOLD,
  DEFAULT_VINTAGE_MATCH_THRESHOLD,
} from "./matcher.js";
export { buildNormalizedQuery, pickBestMatch } from "./matcher.js";
export { nameSimilarity, formatVivinoScore } from "./similarity.js";
