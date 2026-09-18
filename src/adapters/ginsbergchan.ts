/** Ginsberg+Chan adapter — Boost collection grid and Shopify product pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { ginsbergchanBadgeAdapter } from "./ginsbergchan-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?ginsbergchan\.com\//i;

const LISTING_ROOT_SELECTORS = [
  ".boost-pfs-filter-right-col .boost-pfs-filter-products",
  ".boost-pfs-filter-products",
] as const;
const LISTING_CARD_SELECTOR = ".boost-pfs-filter-product-item";
const LISTING_TITLE_SELECTOR = "a.boost-pfs-filter-product-item-title";
const PDP_TITLE_SELECTOR = "h1.product-single__title";

const SALE_PREFIX_PATTERN = /^sale\s+/i;

/** Live chat pill sits above the currency switcher in the bottom-right. */
const GINSBERGCHAN_CHAT_SELECTOR = ".Vtl-LiveChatChannelsWidget";
const GINSBERGCHAN_FAB_FALLBACK_BOTTOM_PX = 120;
const GINSBERGCHAN_FAB_STACK_GAP_PX = 16;

function normalizeGinsbergchanTitle(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(SALE_PREFIX_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isProductDetailPage(root: Document): boolean {
  const path = root.defaultView?.location?.pathname ?? "";
  return /\/products\//i.test(path);
}

function readListingTitle(card: Element): { titleEl: Element; title: string } | null {
  const titleEl = card.querySelector(LISTING_TITLE_SELECTOR);
  const title = normalizeGinsbergchanTitle(titleEl?.textContent ?? "");
  if (!titleEl || title.length < 3) {
    return null;
  }
  return { titleEl, title };
}

function pushProduct(
  products: ProductCandidate[],
  seen: Set<string>,
  titleEl: Element,
  rawTitle: string,
): void {
  const cleaned = normalizeGinsbergchanTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `ginsbergchan::${cleaned}`,
    rawTitle: cleaned,
    element: titleEl,
  });
}

function findListingRoot(root: Document): Element {
  for (const selector of LISTING_ROOT_SELECTORS) {
    const match = root.querySelector(selector);
    if (match) {
      return match;
    }
  }
  return root.body;
}

function extractFromListings(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  const listingRoot = findListingRoot(root);
  for (const card of Array.from(listingRoot.querySelectorAll(LISTING_CARD_SELECTOR))) {
    const listing = readListingTitle(card);
    if (!listing) {
      continue;
    }
    pushProduct(products, seen, listing.titleEl, listing.title);
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
  pushProduct(
    products,
    seen,
    detailTitle,
    normalizeGinsbergchanTitle(detailTitle.textContent),
  );
}

export const ginsbergchanAdapter: RetailerAdapter = {
  id: "ginsbergchan",
  displayName: "Ginsberg+Chan",
  urlPatterns: ["*://ginsbergchan.com/*", "*://www.ginsbergchan.com/*"],
  badge: ginsbergchanBadgeAdapter,
  floatingTrigger: {
    stackAboveSelector: GINSBERGCHAN_CHAT_SELECTOR,
    stackGapPx: GINSBERGCHAN_FAB_STACK_GAP_PX,
    bottomPx: GINSBERGCHAN_FAB_FALLBACK_BOTTOM_PX,
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
    return buildNormalizedQuery(normalizeGinsbergchanTitle(rawTitle));
  },
};
