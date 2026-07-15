/** String normalization and fuzzy name comparison for Vivino matching. */

import { GENERIC_TOKENS, STOP_TOKENS } from "./token-vocab.js";

const VINTAGE_PATTERN = /\b(19|20)\d{2}\b/;

/** Soft penalty per unmatched distinctive cuvée token on the Vivino side. */
const EXTRA_DISTINCTIVE_PENALTY = 0.05;
const EXTRA_DISTINCTIVE_PENALTY_CAP = 0.15;

/** Straight + typographic apostrophes and acute accents used as quotes on shop sites. */
const APOSTROPHE_LIKE_PATTERN = /[\u0027\u0060\u00B4\u2018\u2019\u201A\u201B]/g;

/**
 * Expand common wine abbreviations so shop + Vivino tokens align.
 * e.g. St → Saint, 1er → premier, BdB → Blanc de Blancs.
 */
export function expandWineAbbreviations(value: string): string {
  return value
    .replace(/\b1er\b/gi, "premier")
    .replace(/\bgrd\b/gi, "grand")
    .replace(/\bbdb\b/gi, "Blanc de Blancs")
    .replace(/\bbdn\b/gi, "Blanc de Noirs")
    // Singular shop typos: "Blanc de Blanc" → Blanc de Blancs
    .replace(/\bblanc de blanc\b/gi, "Blanc de Blancs")
    .replace(/\bblanc de noir\b/gi, "Blanc de Noirs")
    .replace(/\b(st|ste)\.?\b/gi, "saint")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip accents and lower-case for comparison. */
export function normalizeText(value: string): string {
  return expandWineAbbreviations(
    value
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(APOSTROPHE_LIKE_PATTERN, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\bd ([a-z])/g, "d$1"),
  );
}

/** Soft penalty when shop declares BdB/BdN but Vivino candidate lacks that phrase. */
const STYLE_MISS_PENALTY = 0.18;

export type WineStylePhrase = "blanc_de_blancs" | "blanc_de_noirs";

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
  /**
   * 1 when shop has no BdB/BdN phrase, or candidate covers it.
   * 0 when shop declares the phrase and candidate does not.
   */
  styleCoverage: number;
}

/** Detect Blanc de Blancs / Blanc de Noirs style phrases (after abbreviation expand). */
export function detectStylePhrase(value: string): WineStylePhrase | null {
  const normalized = normalizeText(value);
  if (/\bblanc de blancs?\b/.test(normalized)) {
    return "blanc_de_blancs";
  }
  if (/\bblanc de noirs?\b/.test(normalized)) {
    return "blanc_de_noirs";
  }
  return null;
}

/** Whether a Vivino title covers the shop's style phrase. */
export function hasStylePhraseCoverage(
  candidate: string,
  style: WineStylePhrase | null,
): boolean {
  if (style === null) {
    return true;
  }
  const normalized = normalizeText(candidate);
  if (style === "blanc_de_blancs") {
    return /\bblanc de blancs?\b/.test(normalized);
  }
  return /\bblanc de noirs?\b/.test(normalized);
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

const NON_VINTAGE_SOURCE = String.raw`\bN\.?\s*V\.?\b|\bnon[-\s]?vintage\b`;

/** Strip shop non-vintage markers (NV, N.V., non-vintage). */
export function stripNonVintageMarkers(value: string): string {
  return value
    .replace(new RegExp(NON_VINTAGE_SOURCE, "gi"), " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/[.,;:]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the raw shop title declares non-vintage (NV / N.V.). */
export function hasNonVintageMarker(value: string): boolean {
  // Fresh regex each call — avoids /g lastIndex sticky false negatives.
  return new RegExp(NON_VINTAGE_SOURCE, "i").test(value);
}

/**
 * Strip champagne dosage words shops add but Vivino often omits.
 * Keeps Blanc de Blancs / Blanc de Noirs — those are identity, not garnish.
 */
export function stripChampagneStyleMarkers(value: string): string {
  return value
    .replace(/\bbrut nature\b/gi, " ")
    .replace(/\bextra[\s-]?brut\b/gi, " ")
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
  return expandWineAbbreviations(
    stripRedundantColorTokens(
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
    ),
  );
}

/**
 * Tokenize for scoring: expand + normalize, drop stops, dedupe preserving order.
 */
function tokenize(value: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const token of normalizeText(value).split(" ")) {
    if (token.length <= 1 || STOP_TOKENS.has(token) || seen.has(token)) {
      continue;
    }
    seen.add(token);
    tokens.push(token);
  }
  return tokens;
}

/** Tokens after "clos" or in BdB/BdN phrases stay distinctive/searchable. */
function styleOrPlotProtectedTokens(tokens: string[]): Set<string> {
  const protectedTokens = new Set<string>();
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (tokens[index] === "clos") {
      protectedTokens.add(tokens[index + 1]);
    }
    if (
      tokens[index] === "blanc" &&
      (tokens[index + 1] === "blancs" ||
        tokens[index + 1] === "noirs" ||
        tokens[index + 1] === "noir")
    ) {
      protectedTokens.add("blanc");
      protectedTokens.add(tokens[index + 1]);
    }
  }
  // normalizeText keeps "de"; tokenize drops stop words — protect after join miss:
  for (let index = 0; index < tokens.length - 2; index += 1) {
    if (
      tokens[index] === "blanc" &&
      tokens[index + 1] === "de" &&
      (tokens[index + 2] === "blancs" ||
        tokens[index + 2] === "noirs" ||
        tokens[index + 2] === "noir")
    ) {
      protectedTokens.add("blanc");
      protectedTokens.add(tokens[index + 2]);
    }
  }
  return protectedTokens;
}

function distinctiveTokens(tokens: string[]): string[] {
  const protectedTokens = styleOrPlotProtectedTokens(tokens);
  return tokens.filter(
    (token) => protectedTokens.has(token) || !GENERIC_TOKENS.has(token),
  );
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
    styleCoverage: 1,
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
    styleCoverage: 1,
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

  const shopStyle = detectStylePhrase(query);
  const styleCoverage = hasStylePhraseCoverage(candidate, shopStyle) ? 1 : 0;

  if (queryNorm === candidateNorm) {
    return { ...perfectBreakdown(), styleCoverage };
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
    return { ...emptyBreakdown(), styleCoverage };
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

  const extraPenalty = Math.min(
    EXTRA_DISTINCTIVE_PENALTY_CAP,
    extraDistinctiveTokens * EXTRA_DISTINCTIVE_PENALTY,
  );

  let composite = base - lengthPenalty - extraPenalty;
  if (substringBoost > 0) {
    // Floor at substringBoost without re-applying extras — producer-only shop
    // titles (e.g. d'Aiguilhe) must still rely on ratingsCount tie-breaks.
    composite = Math.max(composite, substringBoost);
  }

  // Prefer candidates that share the shop's BdB / BdN identity phrase.
  if (shopStyle !== null && styleCoverage === 0) {
    composite = Math.max(0, composite - STYLE_MISS_PENALTY);
  }

  return {
    composite: Math.min(1, Math.max(0, composite)),
    tokenRecall,
    tokenPrecision,
    distinctiveRecall,
    extraDistinctiveTokens,
    substringBoost,
    lengthPenalty,
    styleCoverage,
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
