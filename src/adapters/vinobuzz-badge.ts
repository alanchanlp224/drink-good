/** VinoBuzz badge placement — masonry cards and product overview. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findVinobuzzProductCard(element: Element): Element | null {
  return element.closest("a.wine-card") ?? element.closest("h1.wine-title")?.parentElement ?? null;
}

function styleVinobuzzBadgeHost(badgeHost: HTMLElement): void {
  badgeHost.style.display = "block";
  badgeHost.style.width = "100%";
  badgeHost.style.maxWidth = "100%";
  badgeHost.style.boxSizing = "border-box";
  badgeHost.style.margin = "4px 0";
  badgeHost.style.setProperty("position", "relative", "important");
  badgeHost.style.setProperty("z-index", "3", "important");
  badgeHost.style.pointerEvents = "auto";
}

function insertBeforePriceSection(container: Element, badgeHost: HTMLElement): boolean {
  const price = container.querySelector(".price-section");
  if (!price?.parentElement) {
    return false;
  }
  price.parentElement.insertBefore(badgeHost, price);
  return badgeHost.isConnected;
}

function insertVinobuzzBadge(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost } = ctx;
  styleVinobuzzBadgeHost(badgeHost);

  const listingCard = anchorElement.closest("a.wine-card");
  if (listingCard && insertBeforePriceSection(listingCard, badgeHost)) {
    return;
  }

  if (anchorElement.closest("h1.wine-title")) {
    const priceRow = anchorElement.ownerDocument.querySelector(".rating-price-row");
    if (priceRow?.parentElement) {
      priceRow.parentElement.insertBefore(badgeHost, priceRow);
      return;
    }
  }

  const titleBlock = anchorElement.closest("h3.wine-name, h1.wine-title");
  if (titleBlock?.parentElement) {
    titleBlock.parentElement.insertBefore(badgeHost, titleBlock.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const vinobuzzBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findVinobuzzProductCard,
  insertBadge: insertVinobuzzBadge,
};
