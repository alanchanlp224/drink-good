/** Algolia query distillation and multi-step search cascade. */

import {
  expandWineAbbreviations,
  normalizeText,
  stripBottleSizeMarkers,
  stripChampagneStyleMarkers,
} from "./similarity.js";
import { ALGOLIA_NOISE_TOKENS, ALGOLIA_STOP_TOKENS } from "./token-vocab.js";

/**
 * Compress a normalized shop title into a producer + cuvée focused Algolia query.
 */
export function distillSearchQuery(searchText: string): string {
  const cleaned = expandWineAbbreviations(
    stripBottleSizeMarkers(stripChampagneStyleMarkers(searchText)),
  );
  const tokens = normalizeText(cleaned)
    .split(" ")
    .filter((token) => token.length > 1 && !ALGOLIA_STOP_TOKENS.has(token));

  const kept: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const afterClos = index > 0 && tokens[index - 1] === "clos";
    const inBlancPhrase =
      (token === "blanc" ||
        token === "blancs" ||
        token === "noirs" ||
        token === "noir") &&
      ((index > 0 && tokens[index - 1] === "blanc") ||
        (index + 1 < tokens.length &&
          (tokens[index + 1] === "blancs" ||
            tokens[index + 1] === "noirs" ||
            tokens[index + 1] === "noir" ||
            tokens[index + 1] === "de")) ||
        (index > 1 && tokens[index - 2] === "blanc"));
    if (afterClos || inBlancPhrase || !ALGOLIA_NOISE_TOKENS.has(token)) {
      kept.push(token);
    }
  }

  return kept.join(" ").trim();
}

/**
 * Build ordered Algolia queries: full title, then distilled if it differs.
 * Deliberately avoids last-two / first+last heuristics that pollute results
 * (e.g. "st jean", "jean claude jean").
 */
export function buildAlgoliaSearchQueries(searchText: string): string[] {
  const queries: string[] = [];
  const add = (query: string): void => {
    const trimmed = expandWineAbbreviations(query.trim().replace(/\s+/g, " "));
    if (trimmed.length > 0 && !queries.includes(trimmed)) {
      const lower = trimmed.toLowerCase();
      if (!queries.some((existing) => existing.toLowerCase() === lower)) {
        queries.push(trimmed);
      }
    }
  };

  add(searchText);

  const distilled = distillSearchQuery(searchText);
  if (distilled && distilled.toLowerCase() !== searchText.trim().toLowerCase()) {
    add(distilled);
  }

  return queries;
}
