/** Remfly badge placement — product-cardcontainer cards and PDP h1. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findRemflyProductCard(element: Element): Element | null {
  return (
    element.closest(".product-cardcontainer") ??
    element.closest(".product-cardcontent") ??
    element.closest(".rem-productdetail")
  );
}

/** Match card padding so the badge aligns with title and price text. */
function styleRemflyBadgeHost(badgeHost: HTMLElement): void {
  badgeHost.style.display = "block";
  badgeHost.style.width = "100%";
  badgeHost.style.maxWidth = "100%";
  badgeHost.style.boxSizing = "border-box";
  badgeHost.style.paddingLeft = "0.75rem";
  badgeHost.style.paddingRight = "0.75rem";
}

/** Insert badge above the visible price block inside the card image link. */
function insertBadgeAfterRemflyTitle(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;
  styleRemflyBadgeHost(badgeHost);

  const imageLink =
    productCard?.querySelector("a.product-cardimg") ??
    anchorElement.closest("a.product-cardimg");
  const priceSection = imageLink?.querySelector(
    ":scope > div.px-3:has(.price-container)",
  );
  if (imageLink && priceSection) {
    imageLink.insertBefore(badgeHost, priceSection);
    return;
  }

  const titleLine = anchorElement.closest("p.grid-none, p.list-none, h1.montserrat");
  if (titleLine?.parentElement) {
    titleLine.parentElement.insertBefore(badgeHost, titleLine.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const remflyBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "Montserrat, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findRemflyProductCard,
  insertBadge: insertBadgeAfterRemflyTitle,
};
