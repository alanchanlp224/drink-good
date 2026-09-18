/** Cote d'Or Fine Wines adapter — Flatsome product grid and product pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { cotedorBadgeAdapter } from "./cotedor-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?cotedorfinewines\.com\//i;

const LISTING_ROOT_SELECTOR = ".shop-container";
const LISTING_CARD_SELECTOR = ".product-small.col.type-product";
const LISTING_TITLE_SELECTOR = "p.woocommerce-loop-product__title";
const PDP_TITLE_SELECTOR = "h1.product_title";

/** Case packs such as 6x75cl or 1x73cl are shop format, not the wine name. */
const CASE_SIZE_PATTERN = /\s+\d+\s*x\s*\d+(?:\.\d+)?\s*cl\b/gi;

function normalizeCotedorTitle(raw: string): string {
  return raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function stripCaseSize(raw: string): string {
  return normalizeCotedorTitle(raw).replace(CASE_SIZE_PATTERN, " ").replace(/\s+/g, " ").trim();
}

function isProductDetailPage(root: Document): boolean {
  const path = root.defaultView?.location?.pathname ?? "";
  return /\/product\//i.test(path);
}

function readListingTitle(card: Element): { titleEl: Element; title: string } | null {
  const titleEl = card.querySelector(LISTING_TITLE_SELECTOR);
  const link = titleEl?.querySelector("a");
  const title = normalizeCotedorTitle((link ?? titleEl)?.textContent ?? "");
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
  const cleaned = normalizeCotedorTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `cotedor::${cleaned}`,
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
    normalizeCotedorTitle(detailTitle.textContent),
  );
}

export const cotedorAdapter: RetailerAdapter = {
  id: "cotedor",
  displayName: "Cote d'Or Fine Wines",
  urlPatterns: ["*://cotedorfinewines.com/*", "*://www.cotedorfinewines.com/*"],
  badge: cotedorBadgeAdapter,

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
    return buildNormalizedQuery(stripCaseSize(rawTitle));
  },
};
