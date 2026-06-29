/** Ten Cellars adapter — wine-list listings and wine-page product detail. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { tencellarsBadgeAdapter } from "./tencellars-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?tencellars\.hk\//i;

const LISTING_CARD_SELECTOR = ".wine-list .info, .wine-showcase .info";

function normalizeTencellarsTitle(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildListingTitle(producer: string, wineName: string): string {
  const cleanedProducer = normalizeTencellarsTitle(producer);
  const cleanedWine = normalizeTencellarsTitle(wineName);
  if (!cleanedWine) {
    return cleanedProducer;
  }
  if (!cleanedProducer) {
    return cleanedWine;
  }
  if (cleanedWine.toLowerCase().includes(cleanedProducer.toLowerCase())) {
    return cleanedWine;
  }
  return `${cleanedProducer} ${cleanedWine}`;
}

function isProductDetailPage(root: Document): boolean {
  return Boolean(root.querySelector(".wine-page, .wine-specifics"));
}

function readListingTitle(card: Element): { titleEl: Element; title: string } | null {
  const producer = card.querySelector(".wrapper-hitem > h2")?.textContent ?? "";
  const titleEl =
    card.querySelector(".wrapper-hitem > h1 > a") ??
    card.querySelector(".wrapper-hitem > h1");
  const wineName = titleEl?.textContent ?? "";
  const title = buildListingTitle(producer, wineName);
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
  const cleaned = normalizeTencellarsTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `tencellars::${cleaned}`,
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
  const detailTitle =
    root.querySelector(".wine-page .content > h1") ??
    root.querySelector(".wine-specifics h2");
  if (!detailTitle?.textContent?.trim()) {
    return;
  }
  pushProduct(
    products,
    seen,
    detailTitle,
    normalizeTencellarsTitle(detailTitle.textContent),
  );
}

export const tencellarsAdapter: RetailerAdapter = {
  id: "tencellars",
  displayName: "Ten Cellars",
  urlPatterns: ["*://tencellars.hk/*", "*://www.tencellars.hk/*"],
  badge: tencellarsBadgeAdapter,

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
    return buildNormalizedQuery(normalizeTencellarsTitle(rawTitle));
  },
};
