/** XtraWine adapter — Shopify Algolia collection grid and product detail pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { xtrawineBadgeAdapter } from "./xtrawine-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?xtrawine\.com\//i;

const LISTING_CARD_SELECTOR = "li.grid__item[data-product-id]";
const LISTING_TITLE_SELECTOR = ".grid-product-title a.full-unstyled-link";
const PDP_TITLE_SELECTOR = "h1.pdpprodname, .product__title h1";

function normalizeXtrawineTitle(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readWineLine(titleEl: Element | null): string {
  if (!titleEl) {
    return "";
  }
  const link =
    titleEl instanceof HTMLAnchorElement
      ? titleEl
      : titleEl.querySelector("a.full-unstyled-link, a");
  const titleAttr = link?.getAttribute("title")?.trim() ?? "";
  const text = link?.textContent?.trim() ?? titleEl.textContent?.trim() ?? "";
  return titleAttr.length > text.length ? titleAttr : text;
}

function buildListingTitle(
  vendor: string,
  wineLine: string,
  imageAlt: string,
): string {
  const cleanedVendor = normalizeXtrawineTitle(vendor);
  const cleanedWine = normalizeXtrawineTitle(wineLine);
  const cleanedAlt = normalizeXtrawineTitle(imageAlt);

  if (cleanedAlt.length >= 8) {
    if (
      !cleanedVendor ||
      cleanedAlt.toLowerCase().includes(cleanedVendor.toLowerCase())
    ) {
      return cleanedAlt;
    }
    if (cleanedWine && cleanedAlt.toLowerCase().includes(cleanedWine.toLowerCase())) {
      return cleanedAlt;
    }
  }

  if (!cleanedWine) {
    return cleanedVendor || cleanedAlt;
  }
  if (!cleanedVendor) {
    return cleanedWine;
  }
  if (cleanedWine.toLowerCase().includes(cleanedVendor.toLowerCase())) {
    return cleanedWine;
  }
  return `${cleanedVendor} ${cleanedWine}`;
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
          const name = normalizeXtrawineTitle(
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
  if (!titleEl) {
    return null;
  }

  const vendor = card.querySelector(".grid-product-vendor")?.textContent ?? "";
  const wineLine = readWineLine(titleEl);
  const imageAlt =
    card.querySelector(".card__media img[alt], img[alt]")?.getAttribute("alt") ??
    "";
  const title = buildListingTitle(vendor, wineLine, imageAlt);
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
  const cleaned = normalizeXtrawineTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `xtrawine::${cleaned}`,
    rawTitle: cleaned,
    element: titleEl,
  });
}

function extractFromListings(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  for (const card of Array.from(root.querySelectorAll(LISTING_CARD_SELECTOR))) {
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

  const vendor =
    root.querySelector(".product__text a, .grid-product-vendor")
      ?.textContent ?? "";
  const wineLine = normalizeXtrawineTitle(detailTitle.textContent ?? "");
  const title =
    jsonLdName ?? buildListingTitle(vendor, wineLine, "");

  if (!title) {
    return;
  }

  pushProduct(products, seen, detailTitle, title);
}

export const xtrawineAdapter: RetailerAdapter = {
  id: "xtrawine",
  displayName: "XtraWine",
  urlPatterns: ["*://xtrawine.com/*", "*://www.xtrawine.com/*"],
  badge: xtrawineBadgeAdapter,

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
    return buildNormalizedQuery(normalizeXtrawineTitle(rawTitle));
  },
};
