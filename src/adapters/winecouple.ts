/** Wine Couple adapter — Shopline listings and product detail pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { winecoupleBadgeAdapter } from "./winecouple-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?winecouple\.hk\//i;

const LISTING_ROOT_SELECTOR = ".ProductList-list, .ProductList-content, main";
const PRODUCT_CARD_SELECTOR = "div.product-item, product-item";
const LISTING_TITLE_SELECTOR = ".info-box .title, .title";
const PDP_TITLE_SELECTOR = "h1.Product-title";

/** Shop SKUs live in corner brackets, e.g. 《ZF521A》. */
const SKU_BRACKET_PATTERN = /《[^》]*》/g;
/** Chinese notes, including digits sandwiched between CJK (第 29 版). */
const CJK_RUN_PATTERN =
  /[\u3400-\u9fff\uf900-\ufaff]+(?:\s*\d+\s*[\u3400-\u9fff\uf900-\ufaff]*)*/g;
const PARENTHETICAL_PATTERN = /\([^)]*\)/g;
const PIPE_PATTERN = /[|｜]+/g;
const GIFT_TAIL_PATTERN = /\s+(?:with\s+)?gift\s*(?:box|set)\b.*$/i;

function normalizeWineCoupleTitle(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(SKU_BRACKET_PATTERN, " ")
    .replace(PARENTHETICAL_PATTERN, " ")
    .replace(CJK_RUN_PATTERN, " ")
    .replace(PIPE_PATTERN, " ")
    .replace(GIFT_TAIL_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isProductDetailPage(root: Document): boolean {
  const path = root.defaultView?.location?.pathname ?? "";
  return /\/products\//i.test(path);
}

function readListingTitle(card: Element): { titleEl: Element; title: string } | null {
  const titleEl = card.querySelector(LISTING_TITLE_SELECTOR);
  const title = normalizeWineCoupleTitle(titleEl?.textContent ?? "");
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
  const cleaned = normalizeWineCoupleTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `winecouple::${cleaned}`,
    rawTitle: cleaned,
    element: titleEl,
  });
}

function extractFromListings(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  const listingRoot = root.querySelector(LISTING_ROOT_SELECTOR) ?? root.body;
  for (const card of Array.from(listingRoot.querySelectorAll(PRODUCT_CARD_SELECTOR))) {
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
    normalizeWineCoupleTitle(detailTitle.textContent),
  );
}

export const winecoupleAdapter: RetailerAdapter = {
  id: "winecouple",
  displayName: "Wine Couple",
  urlPatterns: ["*://winecouple.hk/*", "*://www.winecouple.hk/*"],
  badge: winecoupleBadgeAdapter,

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
    return buildNormalizedQuery(normalizeWineCoupleTitle(rawTitle));
  },
};
