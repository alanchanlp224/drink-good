/** Remfly adapter — product-card listings and h1 product detail pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { remflyBadgeAdapter } from "./remfly-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?remfly\.com\.hk\//i;

const PRODUCT_CARD_SELECTOR = ".product-cardcontainer";
const LISTING_TITLE_LINE_SELECTOR =
  "a.product-cardimg p.list-none, .product-cardcontent > p.grid-none, .adminProductCartForm > p.grid-none";
const PDP_TITLE_SELECTOR = "h1.montserrat.text-remdark";

const PACK_PREFIX_PATTERN = /^【\s*\d+\s*(?:支|bts)\s*】\s*/i;
const BOTTLE_SIZE_PATTERN = /\b\d+cl(?:\s*x\s*\d+)?\s*$/i;
const VINTAGE_PATTERN = /\b(19|20)\d{2}\b/;

function normalizeRemflyTitle(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(PACK_PREFIX_PATTERN, "")
    .replace(BOTTLE_SIZE_PATTERN, "")
    .replace(/^\d+%\s*off\s*/i, "")
    .replace(/^ch\.\s+/i, "Chateau ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPackOrSizeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }
  if (/^【\s*\d+\s*支】/.test(trimmed)) {
    return !/[A-Za-z]/.test(trimmed);
  }
  if (/^\d+cl\b/i.test(trimmed)) {
    return true;
  }
  if (/^平均\$/.test(trimmed)) {
    return true;
  }
  return false;
}

function isDescriptionLine(line: string): boolean {
  return line.length > 100 || /是位於|這款酒|葡萄酒/.test(line);
}

/** Prefer the English wine name line with a vintage year for Vivino. */
function pickRemflyTitleLine(lines: string[]): string {
  const candidates = lines
    .map((line) => line.trim())
    .filter((line) => line && !isPackOrSizeLine(line) && !isDescriptionLine(line));

  const vintageLatin = candidates.find(
    (line) => VINTAGE_PATTERN.test(line) && /[A-Za-z]/.test(line),
  );
  if (vintageLatin) {
    return normalizeRemflyTitle(vintageLatin);
  }

  const latin = candidates.find((line) => /[A-Za-z]/.test(line));
  if (latin) {
    return normalizeRemflyTitle(latin);
  }

  return normalizeRemflyTitle(candidates[0] ?? "");
}

function isProductDetailPage(root: Document): boolean {
  const path = root.defaultView?.location?.pathname ?? "";
  return /\/product\/W/i.test(path);
}

function listingTitleLines(card: Element): Element[] {
  const visible = Array.from(card.querySelectorAll("a.product-cardimg p.list-none"));
  if (visible.length > 0) {
    return visible;
  }
  return Array.from(card.querySelectorAll(LISTING_TITLE_LINE_SELECTOR));
}

function readListingTitle(card: Element): { titleEl: Element; title: string } | null {
  const lineEls = listingTitleLines(card);
  const title = pickRemflyTitleLine(
    lineEls.map((lineEl) => lineEl.textContent ?? ""),
  );
  if (!title) {
    return null;
  }

  const titleEl =
    lineEls.find((lineEl) =>
      normalizeRemflyTitle(lineEl.textContent ?? "").includes(title),
    ) ??
    lineEls.find((lineEl) => /[A-Za-z]/.test(lineEl.textContent ?? "")) ??
    lineEls[0];

  if (!titleEl) {
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
  const cleaned = normalizeRemflyTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `remfly::${cleaned}`,
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
    pickRemflyTitleLine([detailTitle.textContent]),
  );
}

export const remflyAdapter: RetailerAdapter = {
  id: "remfly",
  displayName: "Remfly",
  urlPatterns: ["*://remfly.com.hk/*", "*://www.remfly.com.hk/*"],
  badge: remflyBadgeAdapter,

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
    return buildNormalizedQuery(
      pickRemflyTitleLine([normalizeRemflyTitle(rawTitle)]),
    );
  },
};
