/** Wineview HK badge placement and display overrides. */

import type { BadgeAdapter } from "../core/badge-display";
import {
  DEFAULT_BADGE_DISPLAY,
  findWooProductCard,
  insertBadgeAfterTitleBeforePrice,
} from "../core/badge-display";

export const wineviewBadgeAdapter: BadgeAdapter = {
  display: {
    ...DEFAULT_BADGE_DISPLAY,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSizePx: 12,
    hostMargin: "4px 0",
    padding: "3px 6px",
    borderRadiusPx: 5,
    fullWidth: true,
  },
  findProductCard: findWooProductCard,
  insertBadge: insertBadgeAfterTitleBeforePrice,
};
