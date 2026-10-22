/** Wine-Searcher Hong Kong find URL from a Vivino match. */

const WINE_SEARCHER_FIND_ORIGIN = "https://www.wine-searcher.com/find";
const HONG_KONG_LOCATION = "hong+kong";
const TRAILING_YEAR = /\s+(19|20)\d{2}$/;

/** 16px near-black tile with a white wine glass. */
export const WINE_SEARCHER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect width="16" height="16" rx="4" fill="#1a1a1a"/><path fill="#ffffff" fill-rule="evenodd" d="M4.6 3.15h6.8c-.2 1.85-1.4 2.95-2.75 3.2v2.7h1.55v1.1H5.8v-1.1h1.55v-2.7c-1.35-.25-2.55-1.35-2.75-3.2zm1.15.9h4.5c-.22 1-.9 1.5-2.25 1.5s-2.03-.5-2.25-1.5z"/></svg>`;

/**
 * Build a Hong Kong Wine-Searcher URL for the Vivino name.
 * A trailing year that matches `vintage` is sent once, as the vintage segment.
 * Returns null when the name is empty.
 */
export function buildWineSearcherUrl(
  matchedName: string,
  vintage: number | null,
): string | null {
  const name = wineNameForSearch(matchedName, vintage);
  if (!name) {
    return null;
  }
  const namePath = name.split(" ").map((part) => encodeURIComponent(part)).join("+");
  if (vintage === null) {
    return `${WINE_SEARCHER_FIND_ORIGIN}/${namePath}/${HONG_KONG_LOCATION}`;
  }
  return `${WINE_SEARCHER_FIND_ORIGIN}/${namePath}/${vintage}/${HONG_KONG_LOCATION}`;
}

function wineNameForSearch(matchedName: string, vintage: number | null): string {
  const normalized = matchedName.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized || vintage === null) {
    return normalized;
  }
  const trailing = normalized.match(TRAILING_YEAR);
  const trailingYear = trailing ? Number.parseInt(trailing[0].trim(), 10) : null;
  if (trailingYear !== vintage || trailing?.index === undefined) {
    return normalized;
  }
  const stripped = normalized.slice(0, trailing.index).trim();
  return stripped || normalized;
}
