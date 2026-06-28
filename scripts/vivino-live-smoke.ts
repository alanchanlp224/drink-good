#!/usr/bin/env tsx
/** Live smoke test against Vivino — run via `npm run test:vivino:live`. */

import { VivinoClient, formatVivinoScore } from "../src/vivino/index.js";

const WINEVIEW_SAMPLES = [
  "Chateau Lynch Bages 2019",
  "John Duval Wines Entity 2022",
  "Two Paddocks Last Chance Pinot Noir 2021",
  "Domaine Ghislaine Barthod Chambolle-Musigny 1er Cru Aux Beaux-Bruns 2022",
  "Vietti Barolo Brunate 2016",
];

async function main(): Promise<void> {
  const client = new VivinoClient({
    countryCode: "hk",
    currencyCode: "HKD",
    minRequestIntervalMs: 500,
  });

  let matched = 0;
  let missed = 0;

  for (const title of WINEVIEW_SAMPLES) {
    const result = await client.searchWine(title);
    if (result.status === "matched") {
      matched += 1;
      const score = formatVivinoScore(result.candidate.stats.ratingsAverage);
      console.log(
        `✓ ${title}\n  → ${result.candidate.matchedName} (${score}) [${result.confidence.toFixed(2)}] ${result.candidate.source}\n  ${result.candidate.vivinoUrl}`,
      );
    } else {
      missed += 1;
      console.log(
        `? ${title}\n  → ${result.reason} (best: ${result.bestConfidence?.toFixed(2) ?? "n/a"})`,
      );
    }
  }

  console.log(`\n${matched}/${WINEVIEW_SAMPLES.length} matched, ${missed} no-match`);
  if (matched === 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
