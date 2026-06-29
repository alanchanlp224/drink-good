import { describe, expect, it } from "vitest";
import { buildNormalizedQuery, pickBestMatch } from "../../src/vivino/matcher";
import {
  nameSimilarity,
  normalizeForMatch,
  stripNonVintageMarkers,
  stripPackagingMarkers,
  stripRedundantColorTokens,
} from "../../src/vivino/similarity";
import type { VivinoSearchCandidate } from "../../src/vivino/types";

const VESSELLE_CANDIDATE: VivinoSearchCandidate = {
  wineId: 1,
  vintageId: 2,
  matchedName: "Jean Vesselle Oeil de Perdrix Tradition Brut Champagne 1999",
  vintage: 1999,
  stats: { ratingsAverage: 4.1, ratingsCount: 100 },
  vivinoUrl: "https://www.vivino.com/example",
  winery: "Jean Vesselle",
  source: "algolia",
};

describe("normalizeForMatch", () => {
  it("strips NV and redundant Rose for Oeil de Perdrix", () => {
    expect(
      normalizeForMatch("Jean Vesselle Rose Oeil de Perdrix NV"),
    ).toBe("Jean Vesselle Oeil de Perdrix");
  });

  it("strips N.V. with punctuation", () => {
    expect(stripNonVintageMarkers("Some Wine N.V.")).toBe("Some Wine");
  });

  it("strips giftbox packaging suffixes", () => {
    expect(
      normalizeForMatch("Pol Roger Brut Reserve NV (with Giftbox)"),
    ).toBe("Pol Roger Brut Reserve");
    expect(stripPackagingMarkers("Some Wine (Gift Box)")).toBe("Some Wine");
  });

  it("strips flute gift sets from shop titles", () => {
    expect(
      normalizeForMatch(
        "Bollinger Special Cuvee Brut Nv Set With 2 Flutes (with Gift Box)",
      ),
    ).toBe("Bollinger Special Cuvee Brut");
  });

  it("keeps Rose when not Oeil de Perdrix", () => {
    expect(stripRedundantColorTokens("Domaine de la Rose 2020")).toBe(
      "Domaine de la Rose 2020",
    );
  });
});

describe("nameSimilarity — NV/Rose shop titles", () => {
  it("scores Jean Vesselle shop title above name-only threshold", () => {
    const score = nameSimilarity(
      "Jean Vesselle Rose Oeil de Perdrix NV",
      VESSELLE_CANDIDATE.matchedName,
    );
    expect(score).toBeGreaterThanOrEqual(0.72);
  });

  it("does not inflate unrelated wines", () => {
    const score = nameSimilarity(
      "Jean Vesselle Rose Oeil de Perdrix NV",
      "John Duval Entity Shiraz 2022",
    );
    expect(score).toBeLessThan(0.3);
  });
});

describe("pickBestMatch — Jean Vesselle NV", () => {
  it("accepts best candidate above threshold", () => {
    const query = buildNormalizedQuery("Jean Vesselle Rose Oeil de Perdrix NV");
    expect(query.searchText).toBe("Jean Vesselle Oeil de Perdrix");

    const result = pickBestMatch(query, [VESSELLE_CANDIDATE]);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.confidence).toBeGreaterThanOrEqual(0.72);
    }
  });
});
