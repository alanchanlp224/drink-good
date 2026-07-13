/** Vivino Algolia WINES_prod search — full wine catalog. */

import { fetchJson } from "./http.js";
import { resolveCandidateStats } from "./stats.js";
import type { VivinoSearchCandidate } from "./types.js";
import { buildVivinoUrl } from "./url.js";
import { parseVintageYear, pickVintage } from "./vintage-picker.js";

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
  non_vintage?: boolean;
  winery?: { name?: string; seo_name?: string };
  region?: { name?: string; country?: string };
  statistics?: { ratings_average?: number; ratings_count?: number };
  vintages?: AlgoliaVintage[];
}

interface AlgoliaResponse {
  hits?: AlgoliaHit[];
  nbHits?: number;
}

function hitToCandidate(
  hit: AlgoliaHit,
  targetVintage: number | null,
  preferNonVintage: boolean,
  baseUrl: string,
): VivinoSearchCandidate | null {
  const vintage = pickVintage(
    hit.vintages ?? [],
    targetVintage,
    preferNonVintage || hit.non_vintage === true,
  );
  if (!vintage?.id) {
    return null;
  }

  const wineryName = hit.winery?.name ?? null;
  const wineName = hit.name ?? "";
  const matchedName =
    vintage.name ??
    (wineryName ? `${wineryName} ${wineName}`.trim() : wineName);

  const stats = resolveCandidateStats(
    vintage.statistics ?? {},
    hit.statistics ?? null,
  );

  return {
    wineId: hit.id,
    vintageId: vintage.id,
    matchedName,
    vintage: parseVintageYear(vintage.year),
    stats,
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
    preferNonVintage?: boolean;
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
  const preferNonVintage = options.preferNonVintage ?? false;

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
    const candidate = hitToCandidate(
      hit,
      targetVintage,
      preferNonVintage,
      baseUrl,
    );
    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}
