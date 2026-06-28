export { VivinoClient } from "./client.js";
export { searchAlgolia } from "./algolia.js";
export { searchExplore } from "./explore.js";
export {
  buildNormalizedQuery,
  pickBestMatch,
  DEFAULT_VINTAGE_MATCH_THRESHOLD,
  DEFAULT_NAME_ONLY_THRESHOLD,
} from "./matcher.js";
export {
  nameSimilarity,
  normalizeText,
  extractVintage,
  stripVintage,
  formatVivinoScore,
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
