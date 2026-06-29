/** Watson's Wine adapter — custom ww-product-tile listings and h1 PDP titles. */

import { buildNormalizedQuery } from "../vivino/matcher";
import { stripPackagingMarkers } from "../vivino/similarity";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { watsonswineBadgeAdapter } from "./watsonswine-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?watsonswine\.com\//i;

const PRODUCT_TILE_SELECTOR = "ww-product-tile";
const LISTING_TITLE_SELECTOR = "a.product-name";
const PDP_TITLE_SELECTOR = "h1.product-name";

/** Watson's appends promos, gift sets, etc. in parentheses — Vivino titles omit them. */
function stripParentheticalContent(value: string): string {
  return value.replace(/\([^)]*\)/g, " ");
}

/** Drop Watson's suffix clauses after a spaced dash; keep hyphenated names (e.g. Lynch-Bages). */
function stripDashSuffix(value: string): string {
  return value.replace(/\s+[-–—]\s+.*$/, "").trim();
}

function normalizeWatsonsTitle(raw: string): string {
  const withoutParens = stripParentheticalContent(
    raw.replace(/\u00a0/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

  return stripPackagingMarkers(stripDashSuffix(withoutParens));
}

function isProductDetailPage(root: Document): boolean {
  const path = root.defaultView?.location?.pathname ?? "";
  return /\/p\//i.test(path);
}

function readListingTitle(titleEl: Element): string {
  const nameSpan = titleEl.querySelector("span.name");
  const raw = nameSpan?.textContent ?? titleEl.textContent ?? "";
  return normalizeWatsonsTitle(raw);
}

function pushProduct(
  products: ProductCandidate[],
  seen: Set<string>,
  titleEl: Element,
  rawTitle: string,
): void {
  const cleaned = normalizeWatsonsTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `watsonswine::${cleaned}`,
    rawTitle: cleaned,
    element: titleEl,
  });
}

function extractFromProductTiles(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  for (const tile of Array.from(root.querySelectorAll(PRODUCT_TILE_SELECTOR))) {
    const titleEl = tile.querySelector(LISTING_TITLE_SELECTOR);
    if (!titleEl) {
      continue;
    }
    const title = readListingTitle(titleEl);
    if (!title) {
      continue;
    }
    pushProduct(products, seen, titleEl, title);
  }
}

function extractFromListingNameLinks(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  if (products.length > 0) {
    return;
  }

  for (const titleEl of Array.from(
    root.querySelectorAll(`ww-product-list ${LISTING_TITLE_SELECTOR}`),
  )) {
    const title = readListingTitle(titleEl);
    if (!title) {
      continue;
    }
    pushProduct(products, seen, titleEl, title);
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
    normalizeWatsonsTitle(detailTitle.textContent),
  );
}

export const watsonswineAdapter: RetailerAdapter = {
  id: "watsonswine",
  displayName: "Watson's Wine",
  urlPatterns: ["*://watsonswine.com/*", "*://www.watsonswine.com/*"],
  badge: watsonswineBadgeAdapter,

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

    extractFromProductTiles(root, products, seen);
    extractFromListingNameLinks(root, products, seen);

    return products;
  },

  normalizeTitle(rawTitle: string): NormalizedQuery {
    return buildNormalizedQuery(normalizeWatsonsTitle(rawTitle));
  },
};
