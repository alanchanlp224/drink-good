import { describe, expect, it } from "vitest";
import {
  buildAlgoliaSearchQueries,
  distillSearchQuery,
} from "../../src/vivino/search-query.js";
import { pickVintage } from "../../src/vivino/vintage-picker.js";

describe("pickVintage", () => {
  it("returns U.V. when all vintages are non-vintage only", () => {
    const vintages = [
      {
        id: 1502541,
        year: "U.V.",
        statistics: { ratings_count: 1236 },
      },
      {
        id: 1502541,
        year: "",
        statistics: { ratings_count: 1236 },
      },
    ];

    expect(pickVintage(vintages, null)?.id).toBe(1502541);
    expect(pickVintage(vintages, null)?.year).toBe("U.V.");
  });

  it("prefers U.V. over numbered years when preferNonVintage is set", () => {
    const vintages = [
      {
        id: 1,
        year: 2022,
        statistics: { ratings_count: 50 },
      },
      {
        id: 2,
        year: "U.V.",
        statistics: { ratings_count: 700 },
      },
    ];

    expect(pickVintage(vintages, null, true)?.id).toBe(2);
    expect(pickVintage(vintages, null, false)?.id).toBe(1);
  });
});

describe("buildAlgoliaSearchQueries", () => {
  it("cascades from full title to distilled producer + cuvée", () => {
    const queries = buildAlgoliaSearchQueries(
      "Jacques Lassaigne Blanc de Blancs Le Cotet",
    );

    expect(queries[0]).toBe("Jacques Lassaigne Blanc de Blancs Le Cotet");
    expect(queries).toContain("jacques lassaigne cotet");
    expect(queries.at(-1)).toBe("lassaigne cotet");
  });

  it("distills champagne style and bottle size tokens", () => {
    expect(
      distillSearchQuery("Benoit Dehu Initiation Brut Nature Magnum 1.5L"),
    ).toBe("benoit dehu initiation");
  });
});
