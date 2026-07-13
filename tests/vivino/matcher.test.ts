import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { VivinoClient } from "../../src/vivino/client.js";
import {
  buildNormalizedQuery,
  pickBestMatch,
} from "../../src/vivino/matcher.js";
import { nameSimilarity } from "../../src/vivino/similarity.js";
import type { VivinoSearchCandidate } from "../../src/vivino/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture<T>(name: string): T {
  const raw = readFileSync(join(__dirname, "..", "fixtures", name), "utf8");
  return JSON.parse(raw) as T;
}

describe("nameSimilarity", () => {
  it("scores Lynch Bages shop title against Vivino name", () => {
    const score = nameSimilarity(
      "Chateau Lynch Bages 2019",
      "Château Lynch-Bages Pauillac (Grand Cru Classé) 2019",
    );
    expect(score).toBeGreaterThan(0.55);
  });

  it("rejects clearly unrelated wines", () => {
    const score = nameSimilarity(
      "Chateau Lynch Bages 2019",
      "John Duval Entity Shiraz 2022",
    );
    expect(score).toBeLessThan(0.3);
  });

  it("ranks Lynch Bages above Haut-Bages Liberal for Lynch query", () => {
    const lynch = nameSimilarity(
      "Chateau Lynch Bages 2019",
      "Château Lynch-Bages Pauillac (Grand Cru Classé) 2019",
    );
    const haut = nameSimilarity(
      "Chateau Lynch Bages 2019",
      "Château Haut-Bages Libéral Pauillac (Grand Cru Classé) 2019",
    );
    expect(lynch).toBeGreaterThan(haut);
    expect(lynch).toBeGreaterThan(0.55);
  });
});

describe("pickBestMatch", () => {
  it("picks correct 2019 Lynch Bages from explore candidates", () => {
    const explore = loadFixture<{
      explore_vintage: { matches: Array<{ vintage: Record<string, unknown> }> };
    }>("vivino-explore-lynch-bages-2019.json");

    const candidates: VivinoSearchCandidate[] =
      explore.explore_vintage.matches.map((match) => {
        const vintage = match.vintage as {
          id: number;
          year: number;
          name: string;
          statistics: { ratings_average: number; ratings_count: number };
          wine: {
            id: number;
            winery: { name: string; seo_name: string };
          };
        };
        return {
          wineId: vintage.wine.id,
          vintageId: vintage.id,
          matchedName: vintage.name,
          vintage: vintage.year,
          stats: {
            ratingsAverage: vintage.statistics.ratings_average,
            ratingsCount: vintage.statistics.ratings_count,
          },
          vivinoUrl: `https://www.vivino.com/${vintage.wine.winery.seo_name}/w/${vintage.wine.id}?year=${vintage.year}`,
          winery: vintage.wine.winery.name,
          source: "explore" as const,
        };
      });

    const query = buildNormalizedQuery("Chateau Lynch Bages 2019");
    const result = pickBestMatch(query, candidates);

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.vintage).toBe(2019);
      expect(result.candidate.matchedName).toContain("Lynch-Bages");
      expect(result.candidate.stats.ratingsAverage).toBe(4.3);
    }
  });
});

describe("VivinoClient with mocked fetch", () => {
  it("returns matched wine from Algolia path", async () => {
    const algoliaFixture = loadFixture("vivino-algolia-lynch-bages.json");

    const fetchFn: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("algolia.net")) {
        return new Response(JSON.stringify(algoliaFixture), { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url} ${init?.method ?? "GET"}`);
    };

    const client = new VivinoClient({ fetchFn, minRequestIntervalMs: 0 });
    const result = await client.searchWine("Chateau Lynch Bages 2019");

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.vintageId).toBe(159410667);
      expect(result.candidate.stats.ratingsAverage).toBe(4.3);
      expect(result.candidate.stats.scoreScope).toBe("vintage");
    }

    expect(client.cacheSize()).toBe(1);
    const cached = await client.searchWine("Chateau Lynch Bages 2019");
    expect(cached).toEqual(result);
  });

  it("falls back to all-vintage average when vintage score is below threshold", async () => {
    const fetchFn: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("algolia.net")) {
        return new Response(
          JSON.stringify({
            hits: [
              {
                id: 1148839,
                name: "La Chapelle de La Mission Haut-Brion Pessac-Léognan",
                statistics: {
                  ratings_average: 4.2,
                  ratings_count: 8944,
                },
                winery: {
                  name: "Château La Mission Haut-Brion",
                  seo_name: "la-mission-haut-brion",
                },
                vintages: [
                  {
                    id: 173739613,
                    year: 2023,
                    name: "Château La Mission Haut-Brion La Chapelle de La Mission Haut-Brion Pessac-Léognan 2023",
                    statistics: {
                      ratings_average: 0,
                      ratings_count: 10,
                    },
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    };

    const client = new VivinoClient({ fetchFn, minRequestIntervalMs: 0 });
    const result = await client.searchWine(
      "La Chapelle de La Mission Haut-Brion 2023",
    );

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(1148839);
      expect(result.candidate.stats.ratingsAverage).toBe(4.2);
      expect(result.candidate.stats.ratingsCount).toBe(8944);
      expect(result.candidate.stats.scoreScope).toBe("all_vintages");
    }
  });

  it("matches Jacques Lassaigne Le Cotet NV via Algolia cascade", async () => {
    const fetchFn: typeof fetch = async (input, init) => {
      const url = String(input);
      if (!url.includes("algolia.net")) {
        throw new Error(`unexpected fetch: ${url}`);
      }

      const body = JSON.parse(init?.body as string) as { params?: string };
      const query = new URLSearchParams(body.params).get("query") ?? "";

      if (query.includes("Lassaigne") && query.includes("Cotet")) {
        return new Response(
          JSON.stringify({
            hits: [
              {
                id: 1159449,
                name: "Le Cotet Extra Brut Blanc de Blancs Champagne",
                non_vintage: true,
                statistics: { ratings_average: 4.2, ratings_count: 1236 },
                winery: {
                  name: "Jacques Lassaigne",
                  seo_name: "jacques-lassaigne",
                },
                vintages: [
                  {
                    id: 1502541,
                    year: "U.V.",
                    name: "Jacques Lassaigne Le Cotet Extra Brut Blanc de Blancs Champagne",
                    statistics: {
                      ratings_average: 4.2,
                      ratings_count: 1236,
                    },
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ hits: [] }), { status: 200 });
    };

    const client = new VivinoClient({ fetchFn, minRequestIntervalMs: 0 });
    const result = await client.searchWine(
      "Jacques Lassaigne Blanc de Blancs Le Cotet NV",
    );

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(1159449);
      expect(result.candidate.vintage).toBeNull();
    }
  });

  it("matches Benoit Dehu Initiation NV via Algolia cascade", async () => {
    const fetchFn: typeof fetch = async (input, init) => {
      const url = String(input);
      if (!url.includes("algolia.net")) {
        throw new Error(`unexpected fetch: ${url}`);
      }

      const body = JSON.parse(init?.body as string) as { params?: string };
      const query = new URLSearchParams(body.params).get("query") ?? "";

      if (query.toLowerCase().includes("dehu")) {
        return new Response(
          JSON.stringify({
            hits: [
              {
                id: 6864401,
                name: "Initiation",
                non_vintage: true,
                statistics: { ratings_average: 4.2, ratings_count: 763 },
                winery: { name: "Benoît Déhu", seo_name: "benoit-dehu" },
                vintages: [
                  {
                    id: 158937449,
                    year: "U.V.",
                    name: "Benoît Déhu Initiation",
                    statistics: {
                      ratings_average: 4.2,
                      ratings_count: 763,
                    },
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ hits: [] }), { status: 200 });
    };

    const client = new VivinoClient({ fetchFn, minRequestIntervalMs: 0 });
    const result = await client.searchWine(
      "Benoit Dehu 'Initiation' Brut Nature NV",
    );

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(6864401);
      expect(result.candidate.stats.ratingsAverage).toBe(4.2);
    }
  });
});
