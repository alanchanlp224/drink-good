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
    }

    expect(client.cacheSize()).toBe(1);
    const cached = await client.searchWine("Chateau Lynch Bages 2019");
    expect(cached).toEqual(result);
  });
});
