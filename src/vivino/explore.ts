/** Vivino explore API — marketplace search with vintage filters. */

import { fetchJson } from "./http.js";
import type { VivinoSearchCandidate } from "./types.js";
import { buildVivinoUrl } from "./url.js";

interface ExploreMatch {
  vintage?: {
    id?: number;
    year?: number | string;
    name?: string;
    statistics?: {
      ratings_average?: number;
      ratings_count?: number;
    };
    wine?: {
      id?: number;
      name?: string;
      winery?: { name?: string; seo_name?: string };
    };
  };
}

interface ExploreResponse {
  explore_vintage?: {
    matches?: ExploreMatch[];
    records_matched?: number;
  };
}

function parseVintageYear(value: number | string | undefined): number | null {
  if (value === undefined || value === null || value === "U.V.") {
    return null;
  }
  const year = Number.parseInt(String(value), 10);
  return Number.isFinite(year) ? year : null;
}

function matchToCandidate(
  match: ExploreMatch,
  baseUrl: string,
): VivinoSearchCandidate | null {
  const vintage = match.vintage;
  const wine = vintage?.wine;
  const wineId = wine?.id;
  const vintageId = vintage?.id;

  if (!wineId || !vintageId) {
    return null;
  }

  const stats = vintage.statistics ?? {};

  return {
    wineId,
    vintageId,
    matchedName: vintage.name ?? wine.name ?? "Unknown",
    vintage: parseVintageYear(vintage.year),
    stats: {
      ratingsAverage: stats.ratings_average ?? null,
      ratingsCount: stats.ratings_count ?? null,
    },
    vivinoUrl: buildVivinoUrl(
      wineId,
      wine.winery?.seo_name,
      vintage.year ?? null,
      baseUrl,
    ),
    winery: wine.winery?.name ?? null,
    source: "explore",
  };
}

export async function searchExplore(
  searchTerm: string,
  options: {
    vintage?: number | null;
    countryCode?: string;
    currencyCode?: string;
    page?: number;
    baseUrl?: string;
    userAgent?: string;
    fetchFn?: typeof fetch;
    rateLimiter?: import("./http.js").RateLimiter;
    maxRetries?: number;
  },
): Promise<VivinoSearchCandidate[]> {
  const baseUrl = options.baseUrl ?? "https://www.vivino.com";
  const params = new URLSearchParams({
    search_term: searchTerm,
    currency_code: options.currencyCode ?? "HKD",
    country_code: options.countryCode ?? "hk",
    page: String(options.page ?? 1),
  });

  if (options.vintage !== null && options.vintage !== undefined) {
    params.append("wine_years[]", String(options.vintage));
  }

  const data = await fetchJson<ExploreResponse>(
    `${baseUrl}/api/explore/explore?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": options.userAgent ?? "",
        "Accept-Language": "en-US,en;q=0.9",
      },
    },
    {
      fetchFn: options.fetchFn,
      rateLimiter: options.rateLimiter,
      maxRetries: options.maxRetries,
    },
  );

  const candidates: VivinoSearchCandidate[] = [];
  for (const match of data.explore_vintage?.matches ?? []) {
    const candidate = matchToCandidate(match, baseUrl);
    if (candidate) {
      candidates.push(candidate);
    }
  }
  return candidates;
}
