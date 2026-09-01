/** Lyndhurst Wine adapter — Shopify product-card grid and product detail pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { lyndhurstBadgeAdapter } from "./lyndhurst-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?lyndhurstwine\.com\//i;

const LISTING_ROOT_SELECTOR =
  ".collection-products, .collection-product-grid, main";
const LISTING_CARD_SELECTOR =
  "product-card[data-product-id], .js-product-card[data-product-id]";
const PDP_TITLE_SELECTOR = "h1.product-single__title";

function normalizeLyndhurstTitle(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readWineLine(card: Element, titleEl: Element): string {
  const detailsLink = card.querySelector(
    ".product-card__details > a.product-card__link[title]",
  );
  const titleAttr = detailsLink?.getAttribute("title")?.trim() ?? "";
  const componentTitle =
    titleEl.querySelector("product-card-title")?.textContent?.trim() ??
    titleEl.textContent?.trim() ??
    "";
  const linkTitle =
    titleEl instanceof HTMLAnchorElement
      ? titleEl.getAttribute("title")?.trim() ?? ""
      : "";
  const imageAlt =
    card
      .querySelector(".product-card__media img[alt], img.product-card__img[alt]")
      ?.getAttribute("alt")
      ?.trim() ?? "";
  const ariaLabel =
    card
      .querySelector("a.product-card__link[aria-label]")
      ?.getAttribute("aria-label")
      ?.trim() ?? "";

  const candidates = [titleAttr, linkTitle, componentTitle, ariaLabel, imageAlt]
    .map(normalizeLyndhurstTitle)
    .filter((value) => value.length >= 3);
  return candidates.sort((left, right) => right.length - left.length)[0] ?? "";
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
          const name = normalizeLyndhurstTitle(
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
  const titleEl =
    card.querySelector(".product-card__details h3.product-card__title") ??
    card.querySelector("product-card-title") ??
    card.querySelector(".product-card__details a.product-card__link[title]");
  if (!titleEl) {
    return null;
  }

  const title = readWineLine(card, titleEl);
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
  const cleaned = normalizeLyndhurstTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `lyndhurst::${cleaned}`,
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
    jsonLdName ?? normalizeLyndhurstTitle(detailTitle.textContent ?? "");
  if (!title) {
    return;
  }

  pushProduct(products, seen, detailTitle, title);
}

export const lyndhurstAdapter: RetailerAdapter = {
  id: "lyndhurst",
  displayName: "Lyndhurst Wine",
  urlPatterns: ["*://lyndhurstwine.com/*", "*://www.lyndhurstwine.com/*"],
  badge: lyndhurstBadgeAdapter,

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
    return buildNormalizedQuery(normalizeLyndhurstTitle(rawTitle));
  },
};
