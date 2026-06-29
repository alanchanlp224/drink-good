/** Cru World Wine Markets adapter — Angular product listings and detail modals. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { cruBadgeAdapter } from "./cru-badge";

const HOST_PATTERN =
  /^https?:\/\/(?:www\.)?markets\.cruworldwine\.com\//i;

const PRODUCT_CARD_SELECTOR = ".product-outer, app-market-item .product-outer";
const CARD_TITLE_SELECTOR = ".name";
const MAT_ROW_SELECTOR = "mat-row, .mat-row, .mat-mdc-row";
const WINE_NAME_COLUMN_SELECTOR =
  '.mat-column-wine-name, mat-cell.mat-column-wine-name, [class*="mat-column-wine-name"]';
const VINTAGE_COLUMN_SELECTOR =
  '.mat-column-vintage, mat-cell.mat-column-vintage, [class*="mat-column-vintage"]';
const PACK_COLUMN_SELECTOR =
  '.mat-column-pack_size, mat-cell.mat-column-pack_size, [class*="mat-column-pack_size"]';
const TABLE_WINE_SELECTOR =
  ".wine-name .truncated-wine-name, .mat-column-wine-name .truncated-wine-name";
const DETAIL_TITLE_SELECTOR =
  "app-asset-listing-details .modal-title, .cdk-overlay-pane .product-name";

function normalizeCruTitle(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/** Cru often shows pack size separately from the wine name, e.g. "(6x75cl) 2016". */
function stripPackSize(title: string): string {
  return title.replace(/\(\d+x\d+cl\)/gi, " ").replace(/\s+/g, " ").trim();
}

function combineNameAndVintage(name: string, card: Element): string {
  const vintageText = normalizeCruTitle(
    card.querySelector(".vintage-wrapper")?.textContent ?? "",
  );
  if (!vintageText) {
    return name;
  }
  if (name.includes(vintageText)) {
    return name;
  }
  return `${name} ${vintageText}`.trim();
}

function appendColumnText(parts: string[], value: string): void {
  const cleaned = normalizeCruTitle(value);
  if (!cleaned) {
    return;
  }
  if (parts.some((part) => part.includes(cleaned) || cleaned.includes(part))) {
    return;
  }
  parts.push(cleaned);
}

function buildRowTitle(row: Element, name: string): string {
  const parts = [name];
  const vintageCell = row.querySelector(VINTAGE_COLUMN_SELECTOR);
  const packCell = row.querySelector(PACK_COLUMN_SELECTOR);
  appendColumnText(parts, vintageCell?.textContent ?? "");
  appendColumnText(parts, packCell?.textContent ?? "");
  return parts.join(" ").trim();
}

function findWineTitleElement(container: Element): Element | null {
  return (
    container.querySelector(".wine-name a[href]") ??
    container.querySelector(".truncated-wine-name") ??
    container.querySelector(".wine-name") ??
    container.querySelector(CARD_TITLE_SELECTOR)
  );
}

function pushProduct(
  products: ProductCandidate[],
  seen: Set<string>,
  titleEl: Element,
  rawTitle: string,
): void {
  const cleaned = normalizeCruTitle(rawTitle);
  if (cleaned.length < 3 || seen.has(cleaned)) {
    return;
  }
  seen.add(cleaned);
  products.push({
    id: `cru::${cleaned}`,
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
    const titleEl = card.querySelector(CARD_TITLE_SELECTOR);
    const name = normalizeCruTitle(titleEl?.textContent ?? "");
    if (!titleEl || !name) {
      continue;
    }
    pushProduct(products, seen, titleEl, combineNameAndVintage(name, card));
  }
}

function extractFromMatRows(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  for (const row of Array.from(root.querySelectorAll(MAT_ROW_SELECTOR))) {
    const wineCell = row.querySelector(WINE_NAME_COLUMN_SELECTOR);
    if (!wineCell) {
      continue;
    }

    const titleEl = findWineTitleElement(wineCell);
    const name = normalizeCruTitle(titleEl?.textContent ?? "");
    if (!titleEl || !name) {
      continue;
    }

    pushProduct(products, seen, titleEl, buildRowTitle(row, name));
  }
}

function extractFromTruncatedNames(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  for (const titleEl of Array.from(root.querySelectorAll(TABLE_WINE_SELECTOR))) {
    const row = titleEl.closest(MAT_ROW_SELECTOR);
    const rawTitle = row
      ? buildRowTitle(row, normalizeCruTitle(titleEl.textContent ?? ""))
      : normalizeCruTitle(titleEl.textContent ?? "");
    pushProduct(products, seen, titleEl, rawTitle);
  }
}

function extractFromDetailModal(
  root: Document,
  products: ProductCandidate[],
  seen: Set<string>,
): void {
  const detailTitle = root.querySelector(DETAIL_TITLE_SELECTOR);
  if (!detailTitle?.textContent?.trim()) {
    return;
  }
  pushProduct(
    products,
    seen,
    detailTitle,
    normalizeCruTitle(detailTitle.textContent),
  );
}

export const cruAdapter: RetailerAdapter = {
  id: "cru",
  displayName: "Cru World Wine Markets",
  urlPatterns: ["*://markets.cruworldwine.com/*"],
  badge: cruBadgeAdapter,

  matchesUrl(url: string): boolean {
    return HOST_PATTERN.test(url);
  },

  extractProducts(root: Document = document): ProductCandidate[] {
    const products: ProductCandidate[] = [];
    const seen = new Set<string>();

    extractFromProductCards(root, products, seen);
    extractFromMatRows(root, products, seen);
    extractFromTruncatedNames(root, products, seen);

    if (products.length === 0) {
      extractFromDetailModal(root, products, seen);
    }

    return products;
  },

  normalizeTitle(rawTitle: string): NormalizedQuery {
    const cleaned = stripPackSize(rawTitle);
    return buildNormalizedQuery(cleaned);
  },
};
