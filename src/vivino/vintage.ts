/** Fetch vintage details when search results lack ratings. */

import { fetchJson } from "./http.js";
import type { VivinoSearchCandidate } from "./types.js";

interface VintageResponse {
  vintage?: {
    statistics?: {
      ratings_average?: number;
      ratings_count?: number;
    };
  };
}

export async function enrichCandidateStats(
  candidate: VivinoSearchCandidate,
  options: {
    baseUrl?: string;
    userAgent?: string;
    fetchFn?: typeof fetch;
    rateLimiter?: import("./http.js").RateLimiter;
    maxRetries?: number;
  },
): Promise<VivinoSearchCandidate> {
  const hasRating =
    candidate.stats.ratingsAverage !== null &&
    candidate.stats.ratingsAverage > 0;

  if (hasRating) {
    return candidate;
  }

  const baseUrl = options.baseUrl ?? "https://www.vivino.com";
  try {
    const data = await fetchJson<VintageResponse>(
      `${baseUrl}/api/vintages/${candidate.vintageId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": options.userAgent ?? "",
        },
      },
      {
        fetchFn: options.fetchFn,
        rateLimiter: options.rateLimiter,
        maxRetries: options.maxRetries,
      },
    );

    const stats = data.vintage?.statistics;
    if (!stats?.ratings_average) {
      return candidate;
    }

    return {
      ...candidate,
      stats: {
        ratingsAverage: stats.ratings_average,
        ratingsCount: stats.ratings_count ?? candidate.stats.ratingsCount,
        scoreScope: "vintage",
      },
    };
  } catch {
    // Vivino may block vintage detail fetches; keep Algolia/explore stats.
    return candidate;
  }
}
