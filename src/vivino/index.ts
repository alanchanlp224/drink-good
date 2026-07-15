export { VivinoClient } from "./client.js";
export { searchAlgolia } from "./algolia.js";
export { searchExplore } from "./explore.js";
export {
  buildNormalizedQuery,
  pickBestMatch,
  compareScoredCandidates,
  DEFAULT_VINTAGE_MATCH_THRESHOLD,
  DEFAULT_NAME_ONLY_THRESHOLD,
  MATCH_SCORE_TIE_EPSILON,
  type ScoredCandidate,
} from "./matcher.js";
export {
  nameSimilarity,
  normalizeText,
  extractVintage,
  stripVintage,
  formatVivinoScore,
  scoreNameMatch,
  stripConditionMarkers,
  expandWineAbbreviations,
  hasNonVintageMarker,
  type MatchScoreBreakdown,
} from "./similarity.js";
export { buildVivinoUrl } from "./url.js";
export type {
  NormalizedQuery,
  VivinoClientConfig,
  VivinoMatchResult,
  VivinoMatcherConfig,
  VivinoSearchCandidate,
  VivinoVintageStats,
} from "./types.js";
