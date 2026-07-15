import { describe, expect, it } from "vitest";
import {
  buildNormalizedQuery,
  compareScoredCandidates,
  pickBestMatch,
} from "../../src/vivino/matcher";
import {
  nameSimilarity,
  normalizeForMatch,
  normalizeText,
  scoreNameMatch,
  stripConditionMarkers,
  stripNonVintageMarkers,
  stripPackagingMarkers,
  stripRedundantColorTokens,
  hasNonVintageMarker,
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

const CAILLOU_QUARTZ_2021: VivinoSearchCandidate = {
  wineId: 1137114,
  vintageId: 169038894,
  matchedName: "Clos du Caillou Les Quartz Châteauneuf-du-Pape 2021",
  vintage: 2021,
  stats: { ratingsAverage: 4.3, ratingsCount: 71 },
  vivinoUrl: "https://www.vivino.com/clos-du-caillou/w/1137114?year=2021",
  winery: "Clos du Caillou",
  source: "algolia",
};

const CAILLOU_GENERIC_2021: VivinoSearchCandidate = {
  wineId: 1370733,
  vintageId: 167627049,
  matchedName: "Clos du Caillou Châteauneuf-du-Pape 2021",
  vintage: 2021,
  stats: { ratingsAverage: 0, ratingsCount: 7 },
  vivinoUrl: "https://www.vivino.com/clos-du-caillou/w/1370733?year=2021",
  winery: "Clos du Caillou",
  source: "algolia",
};

const BIN707_2016: VivinoSearchCandidate = {
  wineId: 60544,
  vintageId: 1,
  matchedName: "Penfolds Bin 707 Cabernet Sauvignon 2016",
  vintage: 2016,
  stats: { ratingsAverage: 4.5, ratingsCount: 500 },
  vivinoUrl: "https://www.vivino.com/penfolds/w/60544?year=2016",
  winery: "Penfolds",
  source: "algolia",
};

const PENFOLDS_GENERIC_2016: VivinoSearchCandidate = {
  wineId: 99999,
  vintageId: 2,
  matchedName: "Penfolds Cabernet Sauvignon 2016",
  vintage: 2016,
  stats: { ratingsAverage: 4.0, ratingsCount: 200 },
  vivinoUrl: "https://www.vivino.com/penfolds/w/99999?year=2016",
  winery: "Penfolds",
  source: "algolia",
};

const ARMAILHAC_1993: VivinoSearchCandidate = {
  wineId: 4091,
  vintageId: 1,
  matchedName: "Château d'Armailhac Pauillac (Grand Cru Classé) 1993",
  vintage: 1993,
  stats: { ratingsAverage: 4, ratingsCount: 134 },
  vivinoUrl: "https://www.vivino.com/fr-chateau-darmailhac/w/4091?year=1993",
  winery: "Château d'Armailhac",
  source: "algolia",
};

const AIGUILHE_BORDEAUX_2014: VivinoSearchCandidate = {
  wineId: 14517,
  vintageId: 1,
  matchedName: "Château d'Aiguilhe Castillon - Côtes de Bordeaux 2014",
  vintage: 2014,
  stats: { ratingsAverage: 3.9, ratingsCount: 873 },
  vivinoUrl: "https://www.vivino.com/clos-du-caillou/w/14517?year=2014",
  winery: "Clos du Caillou",
  source: "algolia",
};

const AIGUILHE_COMTES_2014: VivinoSearchCandidate = {
  wineId: 13242312,
  vintageId: 3,
  matchedName: "Château d'Aiguilhe Comtes de Neipperg 2014",
  vintage: 2014,
  stats: { ratingsAverage: 4.1, ratingsCount: 30 },
  vivinoUrl: "https://www.vivino.com/w/13242312?year=2014",
  winery: "Clos du Caillou",
  source: "algolia",
};

const AIGUILHE_RHONE_2014: VivinoSearchCandidate = {
  wineId: 1321392,
  vintageId: 2,
  matchedName: "Chateau D'Aiguilhe Côtes du Rhône 2014",
  vintage: 2014,
  stats: { ratingsAverage: 0, ratingsCount: 0 },
  vivinoUrl: "https://www.vivino.com/w/1321392?year=2014",
  winery: null,
  source: "algolia",
};

const LAFON_ROCHET_1989: VivinoSearchCandidate = {
  wineId: 1700690,
  vintageId: 1,
  matchedName: "Château Lafon-Rochet Saint-Estèphe (Grand Cru Classé) 1989",
  vintage: 1989,
  stats: { ratingsAverage: 4, ratingsCount: 100 },
  vivinoUrl: "https://www.vivino.com/w/1700690?year=1989",
  winery: "Château Lafon-Rochet",
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

  it("strips champagne style and bottle size markers", () => {
    expect(
      normalizeForMatch("Jacques Lassaigne Blanc de Blancs Le Cotet NV Magnum 1.5L"),
    ).toBe("Jacques Lassaigne Blanc de Blancs Le Cotet");
    expect(
      normalizeForMatch("Benoit Dehu 'Initiation' Brut Nature NV"),
    ).toBe("Benoit Dehu Initiation");
  });

  it("keeps Blanc de Blancs and expands BdB abbreviation", () => {
    expect(normalizeForMatch("Nicolas Feuillatte, Blanc de Blancs 2019")).toBe(
      "Nicolas Feuillatte, Blanc de Blancs",
    );
    expect(normalizeForMatch("Pol Roger Blanc de Blancs 2016")).toBe(
      "Pol Roger Blanc de Blancs",
    );
    expect(normalizeForMatch("Pertois Moriset Les Quatre Terroirs BdB Grd Cru NV")).toBe(
      "Pertois Moriset Les Quatre Terroirs Blanc de Blancs grand Cru",
    );
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

  it("strips secondary-market condition notes", () => {
    expect(stripConditionMarkers("Chateau Lafon Rochet 1989 (damage label)")).toBe(
      "Chateau Lafon Rochet 1989",
    );
    expect(normalizeForMatch("Chateau Lafon Rochet 1989 (scuffed label)")).toBe(
      "Chateau Lafon Rochet",
    );
  });

  it("normalizes Wineview curly apostrophe in French chateau names", () => {
    const wineviewTitle = "Chateau d\u2019Armailhac 1993";
    expect(normalizeText(normalizeForMatch(wineviewTitle))).toBe(
      "chateau darmailhac",
    );
    expect(
      scoreNameMatch(
        wineviewTitle,
        "Château d'Armailhac Pauillac (Grand Cru Classé) 1993",
      ).composite,
    ).toBeGreaterThan(0.55);
  });

  it("joins spaced d-prefix tokens after apostrophe loss", () => {
    expect(normalizeText("Chateau d Armailhac")).toBe("chateau darmailhac");
  });
});

describe("scoreNameMatch — asymmetric substring (Phase A)", () => {
  it("boosts when Vivino name is a superset of the shop title", () => {
    const breakdown = scoreNameMatch(
      "Chateau Lynch Bages 2019",
      "Château Lynch-Bages Pauillac (Grand Cru Classé) 2019",
    );
    expect(breakdown.substringBoost).toBe(0.92);
    expect(breakdown.composite).toBeGreaterThanOrEqual(0.92);
  });

  it("does not flat-boost generic parent when shop title is more specific", () => {
    const shopTitle =
      "Le CLe Clos du Caillou Chateauneuf du Pape Les Quartz 2021";
    const generic = scoreNameMatch(
      shopTitle,
      "Clos du Caillou Châteauneuf-du-Pape 2021",
    );
    const cuvée = scoreNameMatch(
      shopTitle,
      "Clos du Caillou Les Quartz Châteauneuf-du-Pape 2021",
    );

    expect(generic.substringBoost).toBe(0);
    expect(generic.lengthPenalty).toBeGreaterThan(0);
    expect(cuvée.composite).toBeGreaterThan(generic.composite);
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

describe("pickBestMatch — cuvée vs generic (Phases A–C)", () => {
  it("picks Les Quartz over generic Châteauneuf for Wineview title", () => {
    const query = buildNormalizedQuery(
      "Le CLe Clos du Caillou Chateauneuf du Pape Les Quartz 2021",
    );
    const result = pickBestMatch(query, [
      CAILLOU_GENERIC_2021,
      CAILLOU_QUARTZ_2021,
      {
        ...CAILLOU_GENERIC_2021,
        wineId: 1177105,
        vintageId: 3,
        matchedName: "Clos du Caillou Châteauneuf-du-Pape Les Safres 2021",
        stats: { ratingsAverage: 4.2, ratingsCount: 116 },
      },
    ]);

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(1137114);
      expect(result.candidate.matchedName).toContain("Les Quartz");
      expect(result.candidate.stats.ratingsAverage).toBe(4.3);
    }
  });

  it("picks Bin 707 over generic Penfolds Cabernet", () => {
    const query = buildNormalizedQuery("2016 Penfolds Bin 707");
    const result = pickBestMatch(query, [PENFOLDS_GENERIC_2016, BIN707_2016]);

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.matchedName).toContain("Bin 707");
    }
  });

  it("accepts Jean Vesselle NV above threshold", () => {
    const query = buildNormalizedQuery("Jean Vesselle Rose Oeil de Perdrix NV");
    expect(query.searchText).toBe("Jean Vesselle Oeil de Perdrix");

    const result = pickBestMatch(query, [VESSELLE_CANDIDATE]);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.confidence).toBeGreaterThanOrEqual(0.72);
    }
  });

  it("matches Wineview curly-apostrophe d'Armailhac 1993", () => {
    const wineviewTitle = "Chateau d\u2019Armailhac 1993";
    const query = buildNormalizedQuery(wineviewTitle);
    const result = pickBestMatch(query, [ARMAILHAC_1993]);

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(4091);
      expect(result.candidate.stats.ratingsAverage).toBe(4);
    }
  });

  it("picks rated Castillon d'Aiguilhe over 0-score Rhône sibling", () => {
    const query = buildNormalizedQuery("Chateau d'Aiguilhe 2014");
    const result = pickBestMatch(query, [
      AIGUILHE_RHONE_2014,
      AIGUILHE_BORDEAUX_2014,
      AIGUILHE_COMTES_2014,
    ]);

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(14517);
      expect(result.candidate.stats.ratingsAverage).toBe(3.9);
    }
  });

  it("matches Lafon Rochet when shop title includes damage label note", () => {
    const query = buildNormalizedQuery(
      "Chateau Lafon Rochet 1989 (damage label)",
    );
    const result = pickBestMatch(query, [LAFON_ROCHET_1989]);

    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(1700690);
      expect(result.candidate.stats.ratingsAverage).toBe(4);
    }
  });

  it("matches Benoit Dehu Initiation NV over unrelated Benoit wines", () => {
    const query = buildNormalizedQuery("Benoit Dehu 'Initiation' Brut Nature NV");
    expect(query.nonVintage).toBe(true);

    const initiation: VivinoSearchCandidate = {
      wineId: 6864401,
      vintageId: 158937449,
      matchedName: "Benoît Déhu Initiation",
      vintage: null,
      stats: { ratingsAverage: 4.2, ratingsCount: 763 },
      vivinoUrl: "https://www.vivino.com/benoit-dehu-initiation/w/6864401",
      winery: "Benoît Déhu",
      source: "algolia",
    };
    const initiationRose: VivinoSearchCandidate = {
      wineId: 11098032,
      vintageId: 1,
      matchedName: "Benoît Déhu Initiation Rosé 2022",
      vintage: 2022,
      stats: { ratingsAverage: 4.0, ratingsCount: 20 },
      vivinoUrl: "https://www.vivino.com/w/11098032",
      winery: "Benoît Déhu",
      source: "algolia",
    };

    const result = pickBestMatch(query, [initiationRose, initiation]);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(6864401);
      expect(result.candidate.vintage).toBeNull();
    }
  });

  it("scores Jacques Lassaigne Le Cotet NV above threshold", () => {
    const shop = "Jacques Lassaigne Blanc de Blancs Le Cotet NV";
    const vivino =
      "Jacques Lassaigne Le Cotet Extra Brut Blanc de Blancs Champagne";
    expect(scoreNameMatch(shop, vivino).composite).toBeGreaterThan(0.72);
    expect(
      scoreNameMatch(
        "Jacques Lassaigne Blanc de Blancs Le Cotet NV Magnum 1.5L",
        vivino,
      ).composite,
    ).toBeGreaterThan(0.72);
  });

  it("picks Clos Saint-Jean over Clos du Cailleret for St Jean shop title", () => {
    const query = buildNormalizedQuery(
      "Jean Claude Ramonet Chassagne Montrachet 1er Cru 'Clos St Jean' 2022",
    );
    const saintJean: VivinoSearchCandidate = {
      wineId: 1298739,
      vintageId: 1,
      matchedName:
        "Jean-Claude Ramonet Chassagne-Montrachet Premier Cru 'Clos Saint-Jean' 2022",
      vintage: 2022,
      stats: { ratingsAverage: 4.3, ratingsCount: 1143 },
      vivinoUrl: "https://www.vivino.com/w/1298739?year=2022",
      winery: "Jean-Claude Ramonet",
      source: "algolia",
    };
    const cailleret: VivinoSearchCandidate = {
      wineId: 5016284,
      vintageId: 2,
      matchedName:
        "Jean-Claude Ramonet Chassagne-Montrachet Premier Cru 'Clos du Cailleret' Monopole 2022",
      vintage: 2022,
      stats: { ratingsAverage: 4.5, ratingsCount: 828 },
      vivinoUrl: "https://www.vivino.com/w/5016284?year=2022",
      winery: "Jean-Claude Ramonet",
      source: "algolia",
    };

    const saintScore = scoreNameMatch(query.rawNormalized, saintJean.matchedName);
    const cailleretScore = scoreNameMatch(
      query.rawNormalized,
      cailleret.matchedName,
    );
    expect(saintScore.composite).toBeGreaterThan(cailleretScore.composite);
    expect(saintScore.extraDistinctiveTokens).toBeLessThan(
      cailleretScore.extraDistinctiveTokens,
    );

    const result = pickBestMatch(query, [cailleret, saintJean]);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(1298739);
    }
  });

  it("hasNonVintageMarker is stable across repeated calls", () => {
    const title = "Pol Roger Brut Reserve NV";
    expect(hasNonVintageMarker(title)).toBe(true);
    expect(hasNonVintageMarker(title)).toBe(true);
    expect(hasNonVintageMarker("Lynch Bages 2019")).toBe(false);
    expect(hasNonVintageMarker("Lynch Bages 2019")).toBe(false);
  });

  it("prefers Blanc de Blancs wines over other Feuillatte cuvées", () => {
    const query = buildNormalizedQuery("Nicolas Feuillatte, Blanc de Blancs 2019");
    const collection: VivinoSearchCandidate = {
      wineId: 6266015,
      vintageId: 1,
      matchedName:
        "Nicolas Feuillatte Collection Vintage Blanc de Blancs Brut Millésimé Champagne 2019",
      vintage: 2019,
      stats: { ratingsAverage: 4.1, ratingsCount: 489 },
      vivinoUrl: "https://www.vivino.com/w/6266015?year=2019",
      winery: "Nicolas Feuillatte",
      source: "algolia",
    };
    const palmes: VivinoSearchCandidate = {
      wineId: 1178743,
      vintageId: 2,
      matchedName: "Nicolas Feuillatte Palmes d'Or Brut Champagne 2019",
      vintage: 2019,
      stats: { ratingsAverage: 4.4, ratingsCount: 2000 },
      vivinoUrl: "https://www.vivino.com/w/1178743?year=2019",
      winery: "Nicolas Feuillatte",
      source: "algolia",
    };

    expect(scoreNameMatch(query.rawNormalized, collection.matchedName).styleCoverage).toBe(
      1,
    );
    expect(scoreNameMatch(query.rawNormalized, palmes.matchedName).styleCoverage).toBe(
      0,
    );

    const result = pickBestMatch(query, [palmes, collection]);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(6266015);
    }
  });

  it("prefers Pol Roger Blanc de Blancs over Demi-Sec sibling", () => {
    const query = buildNormalizedQuery("Pol Roger Blanc de Blancs 2016");
    const bdb: VivinoSearchCandidate = {
      wineId: 1649156,
      vintageId: 1,
      matchedName: "Pol Roger Blanc de Blancs Champagne 2016",
      vintage: 2016,
      stats: { ratingsAverage: 4.1, ratingsCount: 209 },
      vivinoUrl: "https://www.vivino.com/w/1649156?year=2016",
      winery: "Pol Roger",
      source: "algolia",
    };
    const demi: VivinoSearchCandidate = {
      wineId: 5991123,
      vintageId: 2,
      matchedName: "Pol Roger Rich Demi-Sec Champagne (Extra Cuvée de Réserve) 2016",
      vintage: 2016,
      stats: { ratingsAverage: 4.0, ratingsCount: 5000 },
      vivinoUrl: "https://www.vivino.com/w/5991123?year=2016",
      winery: "Pol Roger",
      source: "algolia",
    };

    const result = pickBestMatch(query, [demi, bdb]);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect(result.candidate.wineId).toBe(1649156);
    }
  });
});

describe("compareScoredCandidates — tie-breakers (Phase C)", () => {
  it("prefers higher-rated candidate when composite scores tie", () => {
    const left = {
      candidate: CAILLOU_GENERIC_2021,
      breakdown: {
        composite: 0.8,
        tokenRecall: 0.8,
        tokenPrecision: 0.8,
        distinctiveRecall: 0.5,
        extraDistinctiveTokens: 0,
        substringBoost: 0,
        lengthPenalty: 0.1,
        styleCoverage: 1,
      },
    };
    const right = {
      candidate: CAILLOU_QUARTZ_2021,
      breakdown: { ...left.breakdown },
    };

    expect(compareScoredCandidates(left, right)).toBeGreaterThan(0);
  });
});

describe("nameSimilarity — classic cases", () => {
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
