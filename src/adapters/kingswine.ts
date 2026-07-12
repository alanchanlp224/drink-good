/** King's Wine Cellar adapter — Shopify grid listings and product detail pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { kingswineBadgeAdapter } from "./kingswine-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?kingswine\.hk\//i;

const LISTING_ROOT_SELECTOR = "#CollectionAjaxContent, #MainContent, main";
const LISTING_CARD_SELECTOR = ".grid-product[data-product-id]";
const LISTING_TITLE_SELECTOR = ".grid-product__title a.grid-item__link";
const PDP_TITLE_SELECTOR = "h1.product-single__title, .product-single__title";

const SALE_PREFIX_PATTERN = /^sale\s+/i;

function normalizeKingswineTitle(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(SALE_PREFIX_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function readProductJsonLdName(root: Document): string | null {
  for (const script of Array.from(
    root.querySelectorAll('script[type="application/ld+json"]'),
  )) {
    try {
      const parsed: unknown = JSON.parse(script.textContent ?? "");
      const records = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object"
          ? [parsed]
          : [];
      for (const record of records) {
        if (
          record &&
          typeof record === "object" &&
          (record as { "@type"?: string })["@type"] === "Product" &&
          typeof (record as { name?: string }).name === "string"
        ) {
          const name = normalizeKingswineTitle(
            (record as { name: string }).name,
          );
          if (name.length >= 3) {
            return name;
          }
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

function isProductDetailPage(root: Document): boolean {
  const path = root.defaultView?.location?.pathname ?? "";
  return /\/products\//i.test(path);
}

function readListingTitle(card: Element): { titleEl: Element; title: string } | null {
  const titleEl = card.querySelector(LISTING_TITLE_SELECTOR);
  if (!titleEl || titleEl.querySelector("img")) {
    return null;
  }

  const title = normalizeKingswineTitle(titleEl.textContent ?? "");
  if (title.length < 3) {
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
  const cleaned = normalizeKingswineTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `kingswine::${cleaned}`,
    rawTitle: cleaned,
    element: titleEl,
  });
}

function extractFromListings(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  const listingRoot =
    root.querySelector(LISTING_ROOT_SELECTOR) ?? root.body;
  for (const card of Array.from(
    listingRoot.querySelectorAll(LISTING_CARD_SELECTOR),
  )) {
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
  const jsonLdName = readProductJsonLdName(root);
  const detailTitle = root.querySelector(PDP_TITLE_SELECTOR);
  if (!detailTitle) {
    return;
  }

  const title =
    jsonLdName ?? normalizeKingswineTitle(detailTitle.textContent ?? "");
  if (!title) {
    return;
  }

  pushProduct(products, seen, detailTitle, title);
}

/** Smile rewards pill (`.smile-launcher-frame-container`, ~60×146px, bottom-right). */
const KINGSWINE_SMILE_LAUNCHER_SELECTOR = ".smile-launcher-frame-container";
const KINGSWINE_FAB_STACK_GAP_PX = 24;

export const kingswineAdapter: RetailerAdapter = {
  id: "kingswine",
  displayName: "King's Wine Cellar",
  urlPatterns: ["*://kingswine.hk/*", "*://www.kingswine.hk/*"],
  badge: kingswineBadgeAdapter,
  floatingTrigger: {
    stackAboveSelector: KINGSWINE_SMILE_LAUNCHER_SELECTOR,
    stackGapPx: KINGSWINE_FAB_STACK_GAP_PX,
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
    return buildNormalizedQuery(normalizeKingswineTitle(rawTitle));
  },
};
