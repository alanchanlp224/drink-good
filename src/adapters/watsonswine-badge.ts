/** Watson's Wine badge placement — ww-product-tile cards and PDP intro. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findWatsonsProductCard(element: Element): Element | null {
  return (
    element.closest("ww-product-tile") ??
    element.closest(".product-container") ??
    element.closest("cx-product-intro")
  );
}

/** Insert badge after title, before Watson's price block when present. */
function insertBadgeAfterWatsonsTitle(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;

  const priceBlock = productCard?.querySelector(
    "ww-product-price, .price-container, .cx-product-price-container, .cx-product-price",
  );
  if (priceBlock && productCard?.contains(priceBlock)) {
    priceBlock.parentElement?.insertBefore(badgeHost, priceBlock);
    return;
  }

  const nameLink = anchorElement.closest("a.product-name, h1.product-name");
  if (nameLink?.parentElement) {
    nameLink.parentElement.insertBefore(badgeHost, nameLink.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const watsonswineBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findWatsonsProductCard,
  insertBadge: insertBadgeAfterWatsonsTitle,
};
