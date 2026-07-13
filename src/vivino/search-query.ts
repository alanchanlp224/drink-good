/** Algolia query distillation and multi-step search cascade. */

import {
  normalizeText,
  stripBottleSizeMarkers,
  stripChampagneStyleMarkers,
} from "./similarity.js";

/** Single-word tokens omitted from distilled Algolia queries. */
const ALGOLIA_NOISE_TOKENS = new Set([
  "aoc",
  "blanc",
  "blancs",
  "bordeaux",
  "bourgogne",
  "brut",
  "burgundy",
  "champagne",
  "chateau",
  "classic",
  "cru",
  "doc",
  "docg",
  "domaine",
  "dry",
  "extra",
  "grand",
  "magnum",
  "ml",
  "nature",
  "premier",
  "reserve",
  "reserva",
  "rhone",
  "rose",
  "rouge",
  "sec",
  "ste",
  "sweet",
  "tradition",
  "with",
  "gift",
  "box",
  "set",
  "flutes",
  "flute",
  "glasses",
  "glass",
]);

const ALGOLIA_STOP_TOKENS = new Set([
  "de",
  "du",
  "la",
  "le",
  "les",
  "des",
  "the",
  "and",
  "et",
  "of",
  "a",
]);

/**
 * Compress a normalized shop title into a producer + cuvée focused Algolia query.
 */
export function distillSearchQuery(searchText: string): string {
  const cleaned = stripBottleSizeMarkers(stripChampagneStyleMarkers(searchText));
  const tokens = normalizeText(cleaned)
    .split(" ")
    .filter(
      (token) =>
        token.length > 1 &&
        !ALGOLIA_NOISE_TOKENS.has(token) &&
        !ALGOLIA_STOP_TOKENS.has(token),
    );

  return tokens.join(" ").trim();
}

/**
 * Build ordered Algolia queries: full title, distilled, then compact fallbacks.
 */
export function buildAlgoliaSearchQueries(searchText: string): string[] {
  const queries: string[] = [];
  const add = (query: string): void => {
    const trimmed = query.trim().replace(/\s+/g, " ");
    if (trimmed.length > 0 && !queries.includes(trimmed)) {
      queries.push(trimmed);
    }
  };

  add(searchText);

  const distilled = distillSearchQuery(searchText);
  add(distilled);

  const tokens = distilled.split(" ").filter((token) => token.length > 1);
  if (tokens.length >= 3) {
    add(`${tokens[0]} ${tokens[1]} ${tokens.at(-1)!}`);
  }
  if (tokens.length >= 2) {
    add(tokens.slice(-2).join(" "));
  }

  return queries;
}
