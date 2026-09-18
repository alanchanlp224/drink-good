/** Cote d'Or badge placement — Flatsome grid cards and product summary. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findCotedorProductCard(element: Element): Element | null {
  return (
    element.closest(".product-small.col.type-product") ??
    element.closest(".product-small.box") ??
    element.closest(".product-summary, .summary.entry-summary")
  );
}

function styleCotedorBadgeHost(badgeHost: HTMLElement): void {
  badgeHost.style.display = "block";
  badgeHost.style.width = "100%";
  badgeHost.style.maxWidth = "100%";
  badgeHost.style.boxSizing = "border-box";
  badgeHost.style.margin = "4px 0";
  badgeHost.style.setProperty("position", "relative", "important");
  badgeHost.style.setProperty("z-index", "3", "important");
  badgeHost.style.pointerEvents = "auto";
}

function insertBeforePrice(container: Element, badgeHost: HTMLElement): boolean {
  const price = container.querySelector(".price-wrapper, .price");
  if (!price?.parentElement) {
    return false;
  }
  price.parentElement.insertBefore(badgeHost, price);
  return badgeHost.isConnected;
}

function insertCotedorBadge(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost } = ctx;
  styleCotedorBadgeHost(badgeHost);

  const boxText = anchorElement.closest(".box-text");
  if (boxText && insertBeforePrice(boxText, badgeHost)) {
    return;
  }

  if (anchorElement.closest("h1.product_title")) {
    const summary = anchorElement.ownerDocument.querySelector(
      ".summary.entry-summary, .product-summary",
    );
    if (summary && insertBeforePrice(summary, badgeHost)) {
      return;
    }
  }

  const titleBlock = anchorElement.closest(
    "p.woocommerce-loop-product__title, h1.product_title",
  );
  if (titleBlock?.parentElement) {
    titleBlock.parentElement.insertBefore(badgeHost, titleBlock.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const cotedorBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findCotedorProductCard,
  insertBadge: insertCotedorBadge,
};
