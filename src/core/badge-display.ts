/** Per-retailer badge placement and visual options. */

export interface BadgeDisplayOptions {
  fontFamily: string;
  fontSizePx: number;
  fontWeight: number;
  hostMargin: string;
  padding: string;
  borderRadiusPx: number;
  fullWidth: boolean;
}

export interface BadgePlacementContext {
  /** Product title element from the retailer adapter. */
  anchorElement: Element;
  badgeHost: HTMLElement;
  productCard: Element | null;
}

export interface BadgeAdapter {
  display: BadgeDisplayOptions;
  findProductCard(element: Element): Element | null;
  insertBadge(ctx: BadgePlacementContext): void;
}

export const DEFAULT_BADGE_DISPLAY: BadgeDisplayOptions = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSizePx: 13,
  fontWeight: 600,
  hostMargin: "6px 0 0",
  padding: "4px 8px",
  borderRadiusPx: 6,
  fullWidth: true,
};

/** Generic WooCommerce-style card root. */
export function findWooProductCard(element: Element): Element | null {
  return element.closest("li.product, .product");
}

/** Insert badge after title; before price when both share a container. */
export function insertBadgeAfterTitleBeforePrice(
  ctx: BadgePlacementContext,
): void {
  const { anchorElement, badgeHost } = ctx;
  const container = anchorElement.parentElement;
  if (!container) {
    return;
  }

  const price = container.querySelector(
    ".price, .woocommerce-Price-amount, .amount, p.price, span.price",
  );
  if (price && container.contains(price)) {
    container.insertBefore(badgeHost, price);
    return;
  }

  container.insertBefore(badgeHost, anchorElement.nextSibling);
}

/** Fallback: append badge to product card. */
export function insertBadgeAtCardEnd(ctx: BadgePlacementContext): void {
  const { anchorElement, badgeHost, productCard } = ctx;
  if (productCard) {
    productCard.appendChild(badgeHost);
    return;
  }

  anchorElement.parentElement?.insertBefore(
    badgeHost,
    anchorElement.nextSibling,
  );
}
