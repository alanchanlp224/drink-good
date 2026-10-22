import { describe, expect, it } from "vitest";
import { buildWineSearcherUrl } from "../../src/content/wine-searcher";

describe("buildWineSearcherUrl", () => {
  it("sends a trailing vintage year once, in the Hong Kong vintage slot", () => {
    const url = buildWineSearcherUrl("Château Lynch-Bages 2019", 2019);
    expect(url).toBe(
      "https://www.wine-searcher.com/find/Ch%C3%A2teau+Lynch-Bages/2019/hong+kong",
    );
  });

  it("keeps a year that is not the matched vintage inside the name", () => {
    const url = buildWineSearcherUrl("Cuvee 2015 Reserve", 2019);
    expect(url).toBe(
      "https://www.wine-searcher.com/find/Cuvee+2015+Reserve/2019/hong+kong",
    );
  });

  it("searches a non-vintage wine by name only", () => {
    const url = buildWineSearcherUrl("Champagne Laurent Lequart 'Prestige' NV", null);
    expect(url).toBe(
      "https://www.wine-searcher.com/find/Champagne+Laurent+Lequart+'Prestige'+NV/hong+kong",
    );
    expect(url).not.toMatch(/\/\d{4}\//);
  });

  it("returns null for a blank name", () => {
    expect(buildWineSearcherUrl("   ", 2019)).toBeNull();
  });
});
