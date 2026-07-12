/** XtraWine badge placement — Algolia collection cards and Shopify PDP. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findXtrawineProductCard(element: Element): Element | null {
  return (
    element.closest("li.grid__item[data-product-id]") ??
    element.closest("product-info") ??
    element.closest(".product__info-container")
  );
}

function styleXtrawineBadgeHost(badgeHost: HTMLElement): void {
  badgeHost.style.display = "block";
  badgeHost.style.width = "100%";
  badgeHost.style.maxWidth = "100%";
  badgeHost.style.boxSizing = "border-box";
  badgeHost.style.margin = "4px 0";
  badgeHost.style.setProperty("position", "relative", "important");
  badgeHost.style.setProperty("z-index", "10", "important");
  badgeHost.style.pointerEvents = "auto";
}

function findListingContentBlock(card: Element): HTMLElement | null {
  const infoBlock = card.querySelector(
    ".card__information:not(.card__details)",
  );
  const fromInfo = infoBlock?.closest(".card__content");
  if (fromInfo instanceof HTMLElement) {
    return fromInfo;
  }

  const quickAdd = card.querySelector(".card__content.with-quick-add");
  return quickAdd instanceof HTMLElement ? quickAdd : null;
}

/** Dawn cards use `position-static !important`; lift the title/price column above overlay. */
function elevateListingContent(card: Element): void {
  const content = findListingContentBlock(card);
  if (!content) {
    return;
  }
  content.style.setProperty("position", "relative", "important");
  content.style.setProperty("z-index", "2", "important");
}

function insertXtrawineBadge(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;
  styleXtrawineBadgeHost(badgeHost);

  const listingCard = productCard?.matches("li.grid__item[data-product-id]")
    ? productCard
    : anchorElement.closest("li.grid__item[data-product-id]");
  const listingPrice = listingCard?.querySelector(
    ":scope .card-information, :scope .grid-product-price",
  );
  if (listingCard && listingPrice) {
    elevateListingContent(listingCard);
    listingCard
      .querySelector(".card__information:not(.card__details)")
      ?.insertBefore(badgeHost, listingPrice);
    if (badgeHost.isConnected) {
      return;
    }
    listingCard.insertBefore(badgeHost, listingPrice);
    return;
  }

  const productInfo =
    anchorElement.closest("product-info, .product__info-container");
  const detailPrice = productInfo?.querySelector(
    ".pdp-price-block, .price--large, .price",
  );
  if (productInfo && detailPrice) {
    productInfo.insertBefore(badgeHost, detailPrice);
    return;
  }

  const titleBlock = anchorElement.closest(
    ".grid-product-title, .product__title",
  );
  if (titleBlock?.parentElement) {
    titleBlock.parentElement.insertBefore(badgeHost, titleBlock.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const xtrawineBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "Fira Sans, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findXtrawineProductCard,
  insertBadge: insertXtrawineBadge,
};
