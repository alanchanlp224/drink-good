/** Wine Couple badge placement — Shopline product-item cards and PDP title. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findWineCoupleProductCard(element: Element): Element | null {
  return (
    element.closest("div.product-item") ??
    element.closest("product-item") ??
    element.closest(".box-default") ??
    element.closest(".Product-detail")
  );
}

function styleWineCoupleBadgeHost(badgeHost: HTMLElement): void {
  badgeHost.style.display = "block";
  badgeHost.style.width = "100%";
  badgeHost.style.maxWidth = "100%";
  badgeHost.style.boxSizing = "border-box";
  badgeHost.style.margin = "4px 0";
}

/** Insert under the title and above the Shopline price when the card has one. */
function insertWineCoupleBadge(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;
  styleWineCoupleBadgeHost(badgeHost);

  const infoBox =
    productCard?.querySelector(".info-box") ?? anchorElement.closest(".info-box");
  const priceBlock = infoBox?.querySelector(".quick-cart-price, .price-sale, .sl-price");
  if (infoBox && priceBlock?.parentElement) {
    priceBlock.parentElement.insertBefore(badgeHost, priceBlock);
    return;
  }

  const detailTitle = anchorElement.closest("h1.Product-title, .title");
  if (detailTitle?.parentElement) {
    detailTitle.parentElement.insertBefore(badgeHost, detailTitle.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const winecoupleBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findWineCoupleProductCard,
  insertBadge: insertWineCoupleBadge,
};
