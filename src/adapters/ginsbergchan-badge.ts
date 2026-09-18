/** Ginsberg+Chan badge placement — Boost grid cards and Shopify PDP. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findGinsbergchanProductCard(element: Element): Element | null {
  return (
    element.closest(".boost-pfs-filter-product-item") ??
    element.closest(".product-single__meta")
  );
}

function styleGinsbergchanBadgeHost(badgeHost: HTMLElement): void {
  badgeHost.style.display = "block";
  badgeHost.style.width = "100%";
  badgeHost.style.maxWidth = "100%";
  badgeHost.style.boxSizing = "border-box";
  badgeHost.style.margin = "4px 0";
  badgeHost.style.setProperty("position", "relative", "important");
  badgeHost.style.setProperty("z-index", "3", "important");
  badgeHost.style.pointerEvents = "auto";
}

function insertGinsbergchanBadge(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;
  styleGinsbergchanBadgeHost(badgeHost);

  const listingCard = productCard?.matches(".boost-pfs-filter-product-item")
    ? productCard
    : anchorElement.closest(".boost-pfs-filter-product-item");
  const listingPrice = listingCard?.querySelector(
    ".boost-pfs-filter-product-item-price",
  );
  if (listingCard && listingPrice?.parentElement) {
    listingPrice.parentElement.insertBefore(badgeHost, listingPrice);
    return;
  }

  const detailMeta = anchorElement.closest(".product-single__meta");
  const detailPrice = detailMeta?.querySelector(".product-block--price");
  if (detailMeta && detailPrice?.parentElement) {
    detailPrice.parentElement.insertBefore(badgeHost, detailPrice);
    return;
  }

  const titleBlock = anchorElement.closest(
    "a.boost-pfs-filter-product-item-title, h1.product-single__title",
  );
  if (titleBlock?.parentElement) {
    titleBlock.parentElement.insertBefore(badgeHost, titleBlock.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const ginsbergchanBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findGinsbergchanProductCard,
  insertBadge: insertGinsbergchanBadge,
};
