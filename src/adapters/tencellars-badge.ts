/** Ten Cellars badge placement — listing `.info` rows and wine-page detail. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findTencellarsProductCard(element: Element): Element | null {
  return (
    element.closest(".info") ??
    element.closest(".wine-specifics") ??
    element.closest(".wine-page .content")
  );
}

function insertTencellarsBadge(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;
  badgeHost.style.display = "block";
  badgeHost.style.width = "100%";
  badgeHost.style.maxWidth = "100%";
  badgeHost.style.boxSizing = "border-box";
  badgeHost.style.margin = "4px 0";

  const listingCard = productCard?.classList.contains("info")
    ? productCard
    : anchorElement.closest(".info");
  const listingPrice = listingCard?.querySelector(":scope > .price");
  if (listingCard && listingPrice) {
    listingCard.insertBefore(badgeHost, listingPrice);
    return;
  }

  const wineSpecifics = anchorElement.closest(".wine-specifics");
  const detailPrice = wineSpecifics?.querySelector(":scope > .price");
  if (wineSpecifics && detailPrice) {
    wineSpecifics.insertBefore(badgeHost, detailPrice);
    return;
  }

  const content = anchorElement.closest(".wine-page .content, .content");
  if (content) {
    content.insertBefore(badgeHost, anchorElement.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const tencellarsBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 4,
    fullWidth: true,
  },
  findProductCard: findTencellarsProductCard,
  insertBadge: insertTencellarsBadge,
};
