/** RNG Wine adapter — Shopline product listings and product detail pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { rngwineBadgeAdapter } from "./rngwine-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?rngwine\.com\//i;

const PRODUCT_CARD_SELECTOR = "div.product-item, product-item";
const LISTING_TITLE_SELECTOR = "a.Product-item .title, .info-box .title";
const PDP_TITLE_SELECTOR = "h1.Product-title";

function stripParentheticalContent(value: string): string {
  return value.replace(/\([^)]*\)/g, " ");
}

/** Drop suffix clauses after a spaced dash; keep hyphenated names (e.g. Lynch-Bages). */
function stripDashSuffix(value: string): string {
  return value.replace(/\s+[-–—]\s+.*$/, "").trim();
}

function stripRngPrefixes(value: string): string {
  return value
    .replace(/^(?:sale|售完)\s+/i, "")
    .replace(/^\d+ml\s+/i, "")
    .trim();
}

function normalizeRngTitle(raw: string): string {
  return stripDashSuffix(
    stripParentheticalContent(stripRngPrefixes(raw.replace(/\u00a0/g, " ")))
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function isProductDetailPage(root: Document): boolean {
  const path = root.defaultView?.location?.pathname ?? "";
  return /\/products\//i.test(path);
}

function readListingTitle(card: Element): { titleEl: Element; title: string } | null {
  const titleEl = card.querySelector(LISTING_TITLE_SELECTOR);
  const title = normalizeRngTitle(titleEl?.textContent ?? "");
  if (!titleEl || !title) {
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
  const cleaned = normalizeRngTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `rngwine::${cleaned}`,
    rawTitle: cleaned,
    element: titleEl,
  });
}

function extractFromProductCards(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  for (const card of Array.from(root.querySelectorAll(PRODUCT_CARD_SELECTOR))) {
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
    normalizeRngTitle(detailTitle.textContent),
  );
}

export const rngwineAdapter: RetailerAdapter = {
  id: "rngwine",
  displayName: "RNG Wine",
  urlPatterns: ["*://rngwine.com/*", "*://www.rngwine.com/*"],
  badge: rngwineBadgeAdapter,

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

    extractFromProductCards(root, products, seen);
    return products;
  },

  normalizeTitle(rawTitle: string): NormalizedQuery {
    return buildNormalizedQuery(normalizeRngTitle(rawTitle));
  },
};
