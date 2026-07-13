/** String normalization and fuzzy name comparison for Vivino matching. */

const VINTAGE_PATTERN = /\b(19|20)\d{2}\b/;

/** Appellation / region tokens — shared across many wines from one producer. */
const GENERIC_TOKENS = new Set([
  "aoc",
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
  "grand",
  "igt",
  "julien",
  "margaux",
  "medoc",
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
]);

const STOP_TOKENS = new Set([
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

/** Straight + typographic apostrophes and acute accents used as quotes on shop sites. */
const APOSTROPHE_LIKE_PATTERN = /[\u0027\u0060\u00B4\u2018\u2019\u201A\u201B]/g;

/** Strip accents and lower-case for comparison. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(APOSTROPHE_LIKE_PATTERN, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bd ([a-z])/g, "d$1");
}

/** Composite match signals returned by {@link scoreNameMatch}. */
export interface MatchScoreBreakdown {
  composite: number;
  tokenRecall: number;
  tokenPrecision: number;
  distinctiveRecall: number;
  /** Distinctive cuvée tokens on candidate not reflected in shop title. */
  extraDistinctiveTokens: number;
  substringBoost: number;
  lengthPenalty: number;
}

/** Extract a four-digit vintage year from free text. */
export function extractVintage(value: string): number | null {
  const match = value.match(VINTAGE_PATTERN);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[0], 10);
}

/** Remove vintage year tokens from a wine title. */
export function stripVintage(value: string): string {
  return value.replace(VINTAGE_PATTERN, " ").replace(/\s+/g, " ").trim();
}

const NON_VINTAGE_PATTERN = /\bN\.?\s*V\.?\b|\bnon[-\s]?vintage\b/gi;

/** Strip shop non-vintage markers (NV, N.V., non-vintage). */
export function stripNonVintageMarkers(value: string): string {
  return value
    .replace(NON_VINTAGE_PATTERN, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/[.,;:]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the raw shop title declares non-vintage (NV / N.V.). */
export function hasNonVintageMarker(value: string): boolean {
  return NON_VINTAGE_PATTERN.test(value);
}

/** Strip champagne dosage / style words shops add but Vivino often omits. */
export function stripChampagneStyleMarkers(value: string): string {
  return value
    .replace(/\bblanc de blancs\b/gi, " ")
    .replace(/\bbrut nature\b/gi, " ")
    .replace(/\bextra brut\b/gi, " ")
    .replace(/\bdemi[\s-]?sec\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip decorative quotes around cuvée names in shop titles. */
export function stripQuoteMarkers(value: string): string {
  return value
    .replace(/[''""`]([^''""`]+)[''""`]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip bottle format / volume suffixes (magnum, 1.5L, etc.). */
export function stripBottleSizeMarkers(value: string): string {
  return value
    .replace(/\bmagnum\b/gi, " ")
    .replace(/\bhalf\s+bottle\b/gi, " ")
    .replace(/\bjeroboam\b/gi, " ")
    .replace(/\bimperial\b/gi, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:l|ltr|litre|liter)s?\b/gi, " ")
    .replace(/\b(?:375|750|1500|3000)\s*ml\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip gift/packaging suffixes that shops add but Vivino omits. */
export function stripPackagingMarkers(value: string): string {
  const accessoryItems =
    "flutes?|glasses?|coupes?|champagne\\s+flutes?|wine\\s+glasses?";
  const giftBox = "gift\\s*box(?:es)?";

  return value
    .replace(new RegExp(`\\s*\\(\\s*(?:with\\s+)?${giftBox}\\s*\\)\\s*`, "gi"), " ")
    .replace(/\s*\(\s*gift\s*set\s*\)\s*/gi, " ")
    .replace(
      new RegExp(`\\bset\\s+with\\s+\\d+\\s+(?:${accessoryItems})\\b`, "gi"),
      " ",
    )
    .replace(
      new RegExp(`\\bwith\\s+\\d+\\s+(?:${accessoryItems})\\b`, "gi"),
      " ",
    )
    .replace(/\s+with\s+gift\s*box(?:es)?\s*$/gi, "")
    .replace(/\s+gift\s*set\s*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip secondary-market / condition notes shops add but Vivino omits. */
export function stripConditionMarkers(value: string): string {
  return value
    .replace(/\(\s*(?:slightly\s+)?damaged?\s+labels?\s*\)/gi, " ")
    .replace(/\(\s*damage\s+labels?\s*\)/gi, " ")
    .replace(/\(\s*scuffed\s+labels?\s*\)/gi, " ")
    .replace(/\(\s*stained\s+labels?\s*\)/gi, " ")
    .replace(/\(\s*torn\s+labels?\s*\)/gi, " ")
    .replace(/\(\s*bin\s+soiled\s*\)/gi, " ")
    .replace(/\(\s*corroded\s+capsules?\s*\)/gi, " ")
    .replace(/\(\s*ullage[^)]*\)/gi, " ")
    .replace(/\(\s*seepage[^)]*\)/gi, " ")
    .replace(/\(\s*signs?\s+of\s+[^)]+\)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strip redundant colour words when the cuvée name already implies style.
 * e.g. "Rose Oeil de Perdrix" → "Oeil de Perdrix" (rosé is implicit).
 */
export function stripRedundantColorTokens(value: string): string {
  const normalized = normalizeText(value);
  if (!normalized.includes("oeil") || !normalized.includes("perdrix")) {
    return value;
  }
  return value
    .replace(/\bros[eé]s?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize shop + Vivino titles before token similarity or search. */
export function normalizeForMatch(value: string): string {
  return stripRedundantColorTokens(
    stripPackagingMarkers(
      stripConditionMarkers(
        stripBottleSizeMarkers(
          stripChampagneStyleMarkers(
            stripQuoteMarkers(
              stripNonVintageMarkers(stripVintage(value)),
            ),
          ),
        ),
      ),
    ),
  );
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_TOKENS.has(token));
}

function distinctiveTokens(tokens: string[]): string[] {
  return tokens.filter((token) => !GENERIC_TOKENS.has(token));
}

function tokenOverlapScore(
  queryTokens: string[],
  candidateTokens: Set<string>,
): { overlap: number; missing: number } {
  let overlap = 0;
  let missing = 0;

  for (const token of queryTokens) {
    if (candidateTokens.has(token)) {
      overlap += 1;
      continue;
    }

    let partial = false;
    for (const candidateToken of candidateTokens) {
      if (
        candidateToken.startsWith(token) ||
        token.startsWith(candidateToken)
      ) {
        overlap += 0.7;
        partial = true;
        break;
      }
    }

    if (!partial) {
      missing += 1;
    }
  }

  return { overlap, missing };
}

function distinctiveRecallScore(
  queryDistinctive: string[],
  candidateTokens: Set<string>,
): number {
  if (queryDistinctive.length === 0) {
    return 1;
  }

  let matched = 0;
  for (const token of queryDistinctive) {
    if (candidateTokens.has(token)) {
      matched += 1;
      continue;
    }

    for (const candidateToken of candidateTokens) {
      if (
        candidateToken.startsWith(token) ||
        token.startsWith(candidateToken)
      ) {
        matched += 1;
        break;
      }
    }
  }

  return matched / queryDistinctive.length;
}

function countExtraDistinctiveTokens(
  queryTokens: string[],
  candidateTokens: Set<string>,
): number {
  const queryDistinctive = distinctiveTokens(queryTokens);
  const queryDistinctiveSet = new Set(queryDistinctive);
  let extra = 0;

  for (const token of distinctiveTokens([...candidateTokens])) {
    if (queryDistinctiveSet.has(token)) {
      continue;
    }

    let matched = false;
    for (const queryToken of queryDistinctiveSet) {
      if (
        queryToken.startsWith(token) ||
        token.startsWith(queryToken)
      ) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      extra += 1;
    }
  }

  return extra;
}

function emptyBreakdown(): MatchScoreBreakdown {
  return {
    composite: 0,
    tokenRecall: 0,
    tokenPrecision: 0,
    distinctiveRecall: 0,
    extraDistinctiveTokens: 0,
    substringBoost: 0,
    lengthPenalty: 0,
  };
}

function perfectBreakdown(): MatchScoreBreakdown {
  return {
    composite: 1,
    tokenRecall: 1,
    tokenPrecision: 1,
    distinctiveRecall: 1,
    extraDistinctiveTokens: 0,
    substringBoost: 0,
    lengthPenalty: 0,
  };
}

/**
 * Composite name match score with explicit signals (A–D matcher phases).
 * Picks highest composite across candidates in {@link pickBestMatch}.
 */
export function scoreNameMatch(
  query: string,
  candidate: string,
): MatchScoreBreakdown {
  const queryNorm = normalizeText(normalizeForMatch(query));
  const candidateNorm = normalizeText(normalizeForMatch(candidate));

  if (!queryNorm || !candidateNorm) {
    return emptyBreakdown();
  }

  if (queryNorm === candidateNorm) {
    return perfectBreakdown();
  }

  const queryTokens = tokenize(queryNorm);
  const candidateTokenList = tokenize(candidateNorm);
  const candidateTokens = new Set(candidateTokenList);

  if (queryTokens.length === 0 || candidateTokenList.length === 0) {
    return emptyBreakdown();
  }

  const { overlap, missing } = tokenOverlapScore(queryTokens, candidateTokens);
  const missingRatio = missing / queryTokens.length;
  if (missingRatio >= 0.34) {
    return emptyBreakdown();
  }

  const tokenRecall = overlap / queryTokens.length;
  const tokenPrecision = overlap / candidateTokenList.length;
  const distinctiveRecall = distinctiveRecallScore(
    distinctiveTokens(queryTokens),
    candidateTokens,
  );
  const extraDistinctiveTokens = countExtraDistinctiveTokens(
    queryTokens,
    candidateTokens,
  );

  let substringBoost = 0;
  // Phase A: boost only when Vivino name is the longer superset (shop title shortened).
  if (candidateNorm.includes(queryNorm) && queryNorm.length >= 4) {
    substringBoost = 0.92;
  }

  let lengthPenalty = 0;
  // Phase B: penalize generic parent wines when shop title is more specific.
  if (queryNorm.includes(candidateNorm) && queryTokens.length > candidateTokenList.length) {
    const extraTokens = queryTokens.length - candidateTokenList.length;
    lengthPenalty = Math.min(0.2, extraTokens * 0.04);
    lengthPenalty += (1 - distinctiveRecall) * 0.18;
  }

  const base =
    tokenRecall * 0.5 + tokenPrecision * 0.25 + distinctiveRecall * 0.25;

  let composite = base - lengthPenalty;
  if (substringBoost > 0) {
    composite = Math.max(composite, substringBoost);
  }

  return {
    composite: Math.min(1, Math.max(0, composite)),
    tokenRecall,
    tokenPrecision,
    distinctiveRecall,
    extraDistinctiveTokens,
    substringBoost,
    lengthPenalty,
  };
}

/** Back-compat: composite score only (0–1). */
export function nameSimilarity(query: string, candidate: string): number {
  return scoreNameMatch(query, candidate).composite;
}

/** Vivino displays ratings on a 5-point scale; extension shows one decimal. */
export function formatVivinoScore(rating: number | null): string | null {
  if (rating === null || Number.isNaN(rating) || rating <= 0) {
    return null;
  }
  return rating.toFixed(1);
}
