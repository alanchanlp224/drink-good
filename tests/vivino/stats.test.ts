import { describe, expect, it } from "vitest";
import { resolveCandidateStats } from "../../src/vivino/stats.js";

describe("resolveCandidateStats", () => {
  it("uses vintage stats when the vintage has a displayable average", () => {
    expect(
      resolveCandidateStats(
        { ratings_average: 4.3, ratings_count: 101 },
        { ratings_average: 4.2, ratings_count: 8944 },
      ),
    ).toEqual({
      ratingsAverage: 4.3,
      ratingsCount: 101,
      scoreScope: "vintage",
    });
  });

  it("falls back to wine-wide stats when vintage average is below threshold", () => {
    expect(
      resolveCandidateStats(
        { ratings_average: 0, ratings_count: 10 },
        { ratings_average: 4.2, ratings_count: 8944 },
      ),
    ).toEqual({
      ratingsAverage: 4.2,
      ratingsCount: 8944,
      scoreScope: "all_vintages",
    });
  });

  it("keeps vintage scope when neither vintage nor wine has a displayable average", () => {
    expect(
      resolveCandidateStats(
        { ratings_average: 0, ratings_count: 2 },
        { ratings_average: 0, ratings_count: 0 },
      ),
    ).toEqual({
      ratingsAverage: 0,
      ratingsCount: 2,
      scoreScope: "vintage",
    });
  });
});
