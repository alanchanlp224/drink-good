/** VinoBuzz adapter — marketplace masonry cards and product pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { vinobuzzBadgeAdapter } from "./vinobuzz-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?vinobuzz\.ai\//i;

const LISTING_ROOT_SELECTOR = ".search-results-area";
const LISTING_TITLE_SELECTOR = "a.wine-card h3.wine-name";
const PDP_TITLE_SELECTOR = "h1.wine-title";

/** Search dock sits on the bottom edge of the marketplace. */
const VINOBUZZ_SEARCH_DOCK_SELECTOR = ".marketplace-search-dock";
const VINOBUZZ_FAB_STACK_GAP_PX = 16;

function normalizeVinobuzzTitle(raw: string): string {
  return raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function isProductDetailPage(root: Document): boolean {
  const path = root.defaultView?.location?.pathname ?? "";
  return /\/product\//i.test(path);
}

function pushProduct(
  products: ProductCandidate[],
  seen: Set<string>,
  titleEl: Element,
  rawTitle: string,
): void {
  const cleaned = normalizeVinobuzzTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `vinobuzz::${cleaned}`,
    rawTitle: cleaned,
    element: titleEl,
  });
}

function extractFromListings(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  const listingRoot = root.querySelector(LISTING_ROOT_SELECTOR);
  if (!listingRoot) {
    return;
  }
  for (const titleEl of Array.from(listingRoot.querySelectorAll(LISTING_TITLE_SELECTOR))) {
    pushProduct(products, seen, titleEl, titleEl.textContent ?? "");
  }
}

function extractFromProductDetail(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  const detailTitle = root.querySelector(PDP_TITLE_SELECTOR);
  if (!detailTitle?.textContent?.trim()) {
    return;
  }
  pushProduct(products, seen, detailTitle, detailTitle.textContent);
}

export const vinobuzzAdapter: RetailerAdapter = {
  id: "vinobuzz",
  displayName: "VinoBuzz",
  urlPatterns: ["*://vinobuzz.ai/*", "*://www.vinobuzz.ai/*"],
  badge: vinobuzzBadgeAdapter,
  floatingTrigger: {
    stackAboveSelector: VINOBUZZ_SEARCH_DOCK_SELECTOR,
    stackGapPx: VINOBUZZ_FAB_STACK_GAP_PX,
  },

  matchesUrl(url: string): boolean {
    return HOST_PATTERN.test(url);
  },

  extractProducts(root: Document = document): ProductCandidate[] {
    const products: ProductCandidate[] = [];
    const seen = new Set<string>();

    if (isProductDetailPage(root)) {
      extractFromProductDetail(root, products, seen);
      return products;
    }

    extractFromListings(root, products, seen);
    return products;
  },

  normalizeTitle(rawTitle: string): NormalizedQuery {
    return buildNormalizedQuery(normalizeVinobuzzTitle(rawTitle));
  },
};
