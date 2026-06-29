/** RNG Wine badge placement — Shopline product-item cards and PDP title. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findRngProductCard(element: Element): Element | null {
  return (
    element.closest("div.product-item") ??
    element.closest("product-item") ??
    element.closest(".Product-detail")
  );
}

/** Insert badge after title, before Shopline price block when present. */
function insertBadgeAfterRngTitle(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;

  const priceBlock = productCard?.querySelector(
    ".quick-cart-price, .price__regular, .sl-price, .Product-price",
  );
  if (priceBlock && productCard?.contains(priceBlock)) {
    priceBlock.parentElement?.insertBefore(badgeHost, priceBlock);
    return;
  }

  const titleEl = anchorElement.closest(".title, h1.Product-title");
  if (titleEl?.parentElement) {
    titleEl.parentElement.insertBefore(badgeHost, titleEl.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const rngwineBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findRngProductCard,
  insertBadge: insertBadgeAfterRngTitle,
};
