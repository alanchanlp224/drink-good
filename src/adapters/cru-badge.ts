/** Cru World Wine Markets badge placement and display overrides. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  insertBadgeAtCardEnd,
  type BadgePlacementContext,
} from "../core/badge-display";

function findCruProductCard(element: Element): Element | null {
  return (
    element.closest(".product-outer") ??
    element.closest("mat-row, .mat-row, .mat-mdc-row") ??
    element.closest(".wine-cell") ??
    element.closest(".asset-detail-modal-wrapper")
  );
}

/** Insert badge after the wine title, before Cru price blocks when present. */
function insertBadgeAfterCruTitle(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost } = ctx;
  const wineCell = anchorElement.closest(
    '.mat-column-wine-name, [class*="mat-column-wine-name"]',
  );
  if (wineCell) {
    wineCell.appendChild(badgeHost);
    return;
  }

  const column =
    anchorElement.closest(".flex.column, .flex.column.lh-16, .wine-name") ??
    anchorElement.parentElement;

  if (column) {
    const price = column.querySelector(".price-section, .price-value");
    if (price && column.contains(price)) {
      column.insertBefore(badgeHost, price);
      return;
    }

    column.insertBefore(badgeHost, anchorElement.nextSibling);
    return;
  }

  insertBadgeAtCardEnd(ctx);
}

export const cruBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findCruProductCard,
  insertBadge: insertBadgeAfterCruTitle,
};
