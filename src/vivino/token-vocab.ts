/** Shared wine token vocab used by scoring and Algolia distillation. */

/** Tokens omitted for distinctive-cuvee and Algolia distilled queries. */
export const SHARED_WINE_NOISE_TOKENS = [
  "aoc",
  "blanc",
  "blancs",
  "bordeaux",
  "bourgogne",
  "brut",
  "burgundy",
  "champagne",
  "chateau",
  "chateauneuf",
  "class",
  "classe",
  "classic",
  "cotes",
  "cru",
  "doc",
  "docg",
  "domaine",
  "dry",
  "emilion",
  "extra",
  "grand",
  "igt",
  "julien",
  "magnum",
  "margaux",
  "medoc",
  "ml",
  "nature",
  "pape",
  "pauillac",
  "premier",
  "reserve",
  "reserva",
  "rhone",
  "rose",
  "rouge",
  "saint",
  "sec",
  "special",
  "ste",
  "sweet",
  "tradition",
] as const;

/** Appellation / region / style tokens — shared, not distinctive for scoring. */
export const GENERIC_TOKENS = new Set<string>([
  ...SHARED_WINE_NOISE_TOKENS,
]);

/** Single-word tokens stripped from distilled Algolia queries. */
export const ALGOLIA_NOISE_TOKENS = new Set<string>([
  ...SHARED_WINE_NOISE_TOKENS,
  "box",
  "flute",
  "flutes",
  "gift",
  "glass",
  "glasses",
  "set",
  "with",
]);

export const STOP_TOKENS = new Set([
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

export const ALGOLIA_STOP_TOKENS = STOP_TOKENS;
