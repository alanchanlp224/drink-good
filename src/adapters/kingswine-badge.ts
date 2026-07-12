/** King's Wine Cellar badge placement — Shopify grid cards and PDP. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findKingswineProductCard(element: Element): Element | null {
  return (
    element.closest(".grid-product[data-product-id]") ??
    element.closest(".product-single, .product-single__meta")
  );
}

function styleKingswineBadgeHost(badgeHost: HTMLElement): void {
  badgeHost.style.display = "block";
  badgeHost.style.width = "100%";
  badgeHost.style.maxWidth = "100%";
  badgeHost.style.boxSizing = "border-box";
  badgeHost.style.margin = "4px 0";
  badgeHost.style.setProperty("position", "relative", "important");
  badgeHost.style.setProperty("z-index", "3", "important");
  badgeHost.style.pointerEvents = "auto";
}

function insertKingswineBadge(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;
  styleKingswineBadgeHost(badgeHost);

  const listingCard = productCard?.matches(".grid-product[data-product-id]")
    ? productCard
    : anchorElement.closest(".grid-product[data-product-id]");
  const listingPrice = listingCard?.querySelector(
    ".grid-item__meta-secondary .grid-product__price, .grid-product__price",
  );
  if (listingCard && listingPrice?.parentElement) {
    listingPrice.parentElement.insertBefore(badgeHost, listingPrice);
    return;
  }

  const productSingle = anchorElement.closest(
    ".product-single, .product-single__meta",
  );
  const detailPrice = productSingle?.querySelector(
    ".product-block--price, [data-product-price-wrap]",
  );
  if (productSingle && detailPrice) {
    productSingle.insertBefore(badgeHost, detailPrice);
    return;
  }

  const titleBlock = anchorElement.closest(
    ".grid-product__title, .product-single__title, h1.product-single__title",
  );
  if (titleBlock?.parentElement) {
    titleBlock.parentElement.insertBefore(badgeHost, titleBlock.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const kingswineBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findKingswineProductCard,
  insertBadge: insertKingswineBadge,
};
