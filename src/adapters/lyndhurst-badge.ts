/** Lyndhurst Wine badge placement — Shopify product-card grid and PDP. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findLyndhurstProductCard(element: Element): Element | null {
  return (
    element.closest("product-card[data-product-id]") ??
    element.closest(".js-product-card[data-product-id]") ??
    element.closest("product-single[data-product-id]") ??
    element.closest(".product-single.js-product-single")
  );
}

function styleLyndhurstBadgeHost(badgeHost: HTMLElement): void {
  badgeHost.style.display = "block";
  badgeHost.style.width = "100%";
  badgeHost.style.maxWidth = "100%";
  badgeHost.style.boxSizing = "border-box";
  badgeHost.style.margin = "4px 0";
  badgeHost.style.setProperty("position", "relative", "important");
  badgeHost.style.setProperty("z-index", "5", "important");
  badgeHost.style.pointerEvents = "auto";
}

function insertIntoListingDetails(
  listingDetails: Element,
  badgeHost: HTMLElement,
): boolean {
  const titleLink = listingDetails.querySelector(":scope > a.product-card__link");
  if (titleLink) {
    titleLink.insertAdjacentElement("afterend", badgeHost);
    if (badgeHost.isConnected) {
      return true;
    }
  }

  // Fallback: always-visible footer of the card details column.
  listingDetails.appendChild(badgeHost);
  return badgeHost.isConnected;
}

function insertLyndhurstBadge(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;
  styleLyndhurstBadgeHost(badgeHost);

  const listingCard =
    productCard?.matches("product-card[data-product-id], .js-product-card[data-product-id]")
      ? productCard
      : anchorElement.closest(
          "product-card[data-product-id], .js-product-card[data-product-id]",
        );
  const listingDetails = listingCard?.querySelector(".product-card__details");
  if (listingDetails) {
    try {
      if (insertIntoListingDetails(listingDetails, badgeHost)) {
        return;
      }
    } catch {
      listingDetails.appendChild(badgeHost);
      if (badgeHost.isConnected) {
        return;
      }
    }
  }

  const detailPrice = anchorElement
    .closest("product-single[data-product-id], .product-single.js-product-single")
    ?.querySelector(".product-single__box__block--price, .product-single__box .price");
  if (detailPrice?.parentElement) {
    detailPrice.parentElement.insertBefore(badgeHost, detailPrice);
    return;
  }

  const titleBlock = anchorElement.closest(
    "h3.product-card__title, h1.product-single__title",
  );
  if (titleBlock?.parentElement) {
    titleBlock.parentElement.insertBefore(badgeHost, titleBlock.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const lyndhurstBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findLyndhurstProductCard,
  insertBadge: insertLyndhurstBadge,
};
