/** Wineview HK adapter — WooCommerce product listings and product pages. */

import { buildNormalizedQuery } from "../vivino/matcher";
import type { NormalizedQuery } from "../vivino/types";
import type { ProductCandidate, RetailerAdapter } from "../core/adapter";
import { wineviewBadgeAdapter } from "./wineview-badge";

const HOST_PATTERN = /^https?:\/\/(?:www\.)?wineview\.com\.hk\//i;
const PRODUCT_CARD_SELECTOR =
  "li.product, ul.products li, .woocommerce ul.products li.product";
const LISTING_TITLE_SELECTOR =
  ".woocommerce-loop-product__title, h2.woocommerce-loop-product__title, h3.woocommerce-loop-product__title";
const PRODUCT_PAGE_TITLE = "h1.product_title";

function stripSalePrefix(title: string): string {
  return title.replace(/^sale!\s*/i, "").trim();
}

function normalizeWineviewTitle(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function findAttachElement(card: Element, titleEl: Element): Element {
  const link = card.querySelector("a.woocommerce-LoopProduct-link, a[href*='/product/']");
  return (link as Element | null) ?? titleEl;
}

export const wineviewAdapter: RetailerAdapter = {
  id: "wineview",
  displayName: "Wineview HK",
  urlPatterns: ["*://wineview.com.hk/*", "*://www.wineview.com.hk/*"],
  badge: wineviewBadgeAdapter,

  matchesUrl(url: string): boolean {
    return HOST_PATTERN.test(url);
  },

  extractProducts(root: Document = document): ProductCandidate[] {
    const products: ProductCandidate[] = [];
    const seen = new Set<string>();

    const singleTitle = root.querySelector(PRODUCT_PAGE_TITLE);
    if (singleTitle?.textContent?.trim()) {
      const rawTitle = normalizeWineviewTitle(singleTitle.textContent);
      return [
        {
          id: `wineview::${rawTitle}`,
          rawTitle,
          element: singleTitle,
        },
      ];
    }

    const cards = root.querySelectorAll(PRODUCT_CARD_SELECTOR);
    for (const card of Array.from(cards)) {
      const titleEl =
        card.querySelector(LISTING_TITLE_SELECTOR) ??
        card.querySelector("h2") ??
        card.querySelector("h3");

      const rawTitle = normalizeWineviewTitle(titleEl?.textContent ?? "");
      if (!rawTitle || rawTitle.length < 3) {
        continue;
      }

      if (seen.has(rawTitle)) {
        continue;
      }
      seen.add(rawTitle);

      const attachEl = titleEl
        ? findAttachElement(card, titleEl)
        : card;

      products.push({
        id: `wineview::${rawTitle}`,
        rawTitle,
        element: titleEl ?? attachEl,
      });
    }

    return products;
  },

  normalizeTitle(rawTitle: string): NormalizedQuery {
    const cleaned = stripSalePrefix(rawTitle);
    return buildNormalizedQuery(cleaned);
  },
};
