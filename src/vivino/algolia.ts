/** Vivino Algolia WINES_prod search — full wine catalog. */

import { fetchJson } from "./http.js";
import type { VivinoSearchCandidate } from "./types.js";
import { buildVivinoUrl } from "./url.js";

export const DEFAULT_ALGOLIA_APP_ID = "9TAKGWJUXL";
export const DEFAULT_ALGOLIA_API_KEY = "60c11b2f1068885161d95ca068d3a6ae";
export const DEFAULT_ALGOLIA_INDEX = "WINES_prod";

interface AlgoliaVintage {
  id: number;
  year?: number | string;
  name?: string;
  statistics?: {
    ratings_average?: number;
    ratings_count?: number;
  };
}

interface AlgoliaHit {
  id: number;
  name?: string;
  seo_name?: string;
  type_id?: number;
  winery?: { name?: string; seo_name?: string };
  region?: { name?: string; country?: string };
  statistics?: { ratings_average?: number; ratings_count?: number };
  vintages?: AlgoliaVintage[];
}

interface AlgoliaResponse {
  hits?: AlgoliaHit[];
  nbHits?: number;
}

function parseVintageYear(value: number | string | undefined): number | null {
  if (value === undefined || value === null || value === "U.V.") {
    return null;
  }
  const year = Number.parseInt(String(value), 10);
  return Number.isFinite(year) ? year : null;
}

function pickVintage(
  vintages: AlgoliaVintage[],
  targetVintage: number | null,
): AlgoliaVintage | null {
  if (vintages.length === 0) {
    return null;
  }

  if (targetVintage !== null) {
    const exact = vintages.find(
      (v) => parseVintageYear(v.year) === targetVintage,
    );
    if (exact) {
      return exact;
    }
    return null;
  }

  const rated = vintages.filter(
    (v) => ((v.statistics?.ratings_count as number | undefined) ?? 0) > 0,
  );
  const pool = rated.length > 0 ? rated : vintages;
  return pool.reduce<AlgoliaVintage | null>((best, current) => {
    const bestYear = parseVintageYear(best?.year) ?? -1;
    const currentYear = parseVintageYear(current.year) ?? -1;
    return currentYear > bestYear ? current : best;
  }, null);
}

function hitToCandidate(
  hit: AlgoliaHit,
  targetVintage: number | null,
  baseUrl: string,
): VivinoSearchCandidate | null {
  const vintage = pickVintage(hit.vintages ?? [], targetVintage);
  if (!vintage?.id) {
    return null;
  }

  const wineryName = hit.winery?.name ?? null;
  const wineName = hit.name ?? "";
  const matchedName =
    vintage.name ??
    (wineryName ? `${wineryName} ${wineName}`.trim() : wineName);

  const stats = vintage.statistics ?? hit.statistics ?? {};

  return {
    wineId: hit.id,
    vintageId: vintage.id,
    matchedName,
    vintage: parseVintageYear(vintage.year),
    stats: {
      ratingsAverage: stats.ratings_average ?? null,
      ratingsCount: stats.ratings_count ?? null,
    },
    vivinoUrl: buildVivinoUrl(
      hit.id,
      hit.winery?.seo_name,
      vintage.year ?? null,
      baseUrl,
    ),
    winery: wineryName,
    source: "algolia",
  };
}

export async function searchAlgolia(
  query: string,
  options: {
    hitsPerPage?: number;
    targetVintage?: number | null;
    baseUrl?: string;
    appId?: string;
    apiKey?: string;
    index?: string;
    userAgent?: string;
    fetchFn?: typeof fetch;
    rateLimiter?: import("./http.js").RateLimiter;
    maxRetries?: number;
  },
): Promise<VivinoSearchCandidate[]> {
  const appId = options.appId ?? DEFAULT_ALGOLIA_APP_ID;
  const apiKey = options.apiKey ?? DEFAULT_ALGOLIA_API_KEY;
  const index = options.index ?? DEFAULT_ALGOLIA_INDEX;
  const baseUrl = options.baseUrl ?? "https://www.vivino.com";
  const hitsPerPage = options.hitsPerPage ?? 15;

  const url = `https://${appId}-dsn.algolia.net/1/indexes/${index}/query`;
  const params = new URLSearchParams({
    query,
    hitsPerPage: String(hitsPerPage),
  });

  const data = await fetchJson<AlgoliaResponse>(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": options.userAgent ?? "",
        "x-algolia-application-id": appId,
        "x-algolia-api-key": apiKey,
      },
      body: JSON.stringify({ params: params.toString() }),
    },
    {
      fetchFn: options.fetchFn,
      rateLimiter: options.rateLimiter,
      maxRetries: options.maxRetries,
    },
  );

  const targetVintage = options.targetVintage ?? null;
  const candidates: VivinoSearchCandidate[] = [];

  for (const hit of data.hits ?? []) {
    const candidate = hitToCandidate(hit, targetVintage, baseUrl);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}
