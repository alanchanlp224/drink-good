/** In-page Vivino score badge overlay. */

import type { BadgeAdapter, BadgeDisplayOptions } from "../core/badge-display";
import {
  getScoreStyle,
  scoreBadgeBackground,
  scoreBadgeBorder,
  scoreStarColor,
} from "../shared/score-style";
import { formatVivinoScore } from "../vivino/similarity";
import type { ScoreScope, VivinoMatchResult } from "../vivino/types";
import { buildWineSearcherUrl, WINE_SEARCHER_ICON_SVG } from "./wine-searcher";

const BADGE_CLASS = "drink-good-badge";
const BADGE_ATTR = "data-drink-good-badge";
const WINE_SEARCHER_ATTR = "data-drink-good-wine-searcher";
const WINE_SEARCHER_SLOT = "wine-searcher";

let suppressMutationHandling = false;

/** Skip MutationObserver re-entry while injecting badges. */
export function withBadgeInjection<T>(fn: () => T): T {
  suppressMutationHandling = true;
  try {
    return fn();
  } finally {
    requestAnimationFrame(() => {
      suppressMutationHandling = false;
    });
  }
}

export function shouldSuppressMutationHandling(): boolean {
  return suppressMutationHandling;
}

export function hasBadge(element: Element, badgeAdapter: BadgeAdapter): boolean {
  const card = badgeAdapter.findProductCard(element);
  if (card) {
    return card.querySelector(`[${BADGE_ATTR}]`) !== null;
  }
  return element.parentElement?.querySelector(`[${BADGE_ATTR}]`) !== null;
}

/** Remove every badge on the page so a new run can re-fetch Vivino scores. */
export function removeAllPageBadges(): void {
  withBadgeInjection(() => {
    document.querySelectorAll(`[${BADGE_ATTR}]`).forEach((node) => node.remove());
  });
}

export function renderBadge(
  anchorElement: Element,
  result: VivinoMatchResult,
  badgeAdapter: BadgeAdapter,
): void {
  withBadgeInjection(() => {
    removeExistingBadge(anchorElement, badgeAdapter);

    if (result.status === "matched") {
      placeBadge(
        anchorElement,
        buildMatchedBadge(result, badgeAdapter.display),
        badgeAdapter,
        result.candidate.vivinoUrl,
      );
      return;
    }

    placeBadge(
      anchorElement,
      buildUnknownBadge(
        result.reason || "No confident Vivino match",
        badgeAdapter.display,
      ),
      badgeAdapter,
    );
  });
}

function placeBadge(
  anchorElement: Element,
  badgeHost: HTMLElement,
  badgeAdapter: BadgeAdapter,
  vivinoUrl?: string,
): void {
  const productCard = badgeAdapter.findProductCard(anchorElement);
  badgeAdapter.insertBadge({
    anchorElement,
    badgeHost,
    productCard,
  });
  if (vivinoUrl) {
    armBadgeClickGuard(badgeHost, vivinoUrl, productCard);
  }
}

/**
 * Intercept clicks over the badge before full-card overlay links (e.g. Shopify
 * Dawn) receive them; coordinate hit-testing ignores shadow DOM and z-index.
 */
function armBadgeClickGuard(
  badgeHost: HTMLElement,
  vivinoUrl: string,
  productCard: Element | null,
): void {
  const root = productCard ?? badgeHost.parentElement;
  if (!root || badgeHost.dataset.drinkGoodClickGuard === "armed") {
    return;
  }
  badgeHost.dataset.drinkGoodClickGuard = "armed";

  root.addEventListener(
    "click",
    (event: Event) => {
      if (!(event instanceof MouseEvent) || event.button !== 0) {
        return;
      }

      const path = event.composedPath();
      const rect = badgeHost.getBoundingClientRect();
      const inBadgeBounds = pointInRect(event.clientX, event.clientY, rect);

      if (!inBadgeBounds && !path.includes(badgeHost)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const destination = wineSearcherDestination(badgeHost, path, event) ?? vivinoUrl;
      window.open(destination, "_blank", "noopener,noreferrer");
    },
    true,
  );
}

/**
 * Wine-Searcher control is a light-DOM child slotted into the badge.
 * The card click guard cannot see nodes inside the closed shadow root, so the
 * icon has to stay outside it to open Wine-Searcher instead of Vivino.
 */
function wineSearcherDestination(
  badgeHost: HTMLElement,
  path: EventTarget[],
  event: MouseEvent,
): string | null {
  const fromPath = path.find(
    (node): node is HTMLAnchorElement =>
      node instanceof HTMLAnchorElement && node.matches(`[${WINE_SEARCHER_ATTR}]`),
  );
  if (fromPath?.href) {
    return fromPath.href;
  }

  const searchLink = badgeHost.querySelector<HTMLAnchorElement>(`[${WINE_SEARCHER_ATTR}]`);
  if (!searchLink?.href) {
    return null;
  }
  const rect = searchLink.getBoundingClientRect();
  return pointInRect(event.clientX, event.clientY, rect) ? searchLink.href : null;
}

function pointInRect(x: number, y: number, rect: DOMRect): boolean {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}

function buildMatchedBadge(
  result: Extract<VivinoMatchResult, { status: "matched" }>,
  display: BadgeDisplayOptions,
): HTMLElement {
  const scoreValue = result.candidate.stats.ratingsAverage;
  const score = formatVivinoScore(scoreValue);
  const style = getScoreStyle(scoreValue);
  const wineName = result.candidate.matchedName;
  const reviewCount = result.candidate.stats.ratingsCount;
  const scoreScope = result.candidate.stats.scoreScope ?? "vintage";
  const vivinoUrl = result.candidate.vivinoUrl;
  const wineSearcherUrl = buildWineSearcherUrl(wineName, result.candidate.vintage);

  const { host, shadow } = createBadgeHost(`${BADGE_CLASS}--${style.id}`);

  const row = document.createElement("div");
  row.className = "badge-row";

  const link = document.createElement("a");
  link.className = "vivino-link";
  link.href = vivinoUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = buildTooltip(wineName, reviewCount, scoreScope);
  link.innerHTML = buildBadgeMarkup(score, reviewCount, wineName, scoreScope);
  link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.open(vivinoUrl, "_blank", "noopener,noreferrer");
  });
  row.appendChild(link);

  if (wineSearcherUrl) {
    row.appendChild(createWineSearcherSlot());
    host.appendChild(createWineSearcherLink(wineSearcherUrl));
  }

  shadow.appendChild(createBadgeStyle(style.accent, display));
  shadow.appendChild(row);

  return host;
}

function createWineSearcherSlot(): HTMLSlotElement {
  const slot = document.createElement("slot");
  slot.name = WINE_SEARCHER_SLOT;
  return slot;
}

function createWineSearcherLink(url: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.slot = WINE_SEARCHER_SLOT;
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = "Hong Kong prices on Wine-Searcher";
  link.setAttribute("aria-label", "Search this wine on Wine-Searcher");
  link.setAttribute(WINE_SEARCHER_ATTR, "true");
  link.innerHTML = WINE_SEARCHER_ICON_SVG;
  styleWineSearcherLink(link);
  return link;
}

function styleWineSearcherLink(link: HTMLAnchorElement): void {
  const important: Record<string, string> = {
    flex: "0 0 auto",
    display: "inline-flex",
    width: "16px",
    height: "16px",
    margin: "0",
    padding: "0",
    border: "none",
    background: "transparent",
    "line-height": "0",
    "text-decoration": "none",
    cursor: "pointer",
    position: "relative",
    "z-index": "4",
    "pointer-events": "auto",
  };
  for (const [property, value] of Object.entries(important)) {
    link.style.setProperty(property, value, "important");
  }
}

function buildUnknownBadge(
  reason: string,
  display: BadgeDisplayOptions,
): HTMLElement {
  const style = getScoreStyle(null);
  const { host, shadow } = createBadgeHost(`${BADGE_CLASS}--unknown`);

  const label = document.createElement("span");
  label.className = "badge";
  label.title = reason;
  label.innerHTML = `<span class="star" aria-hidden="true">★</span> ? <span class="name">— No Vivino match</span>`;

  shadow.appendChild(createBadgeStyle(style.accent, display));
  shadow.appendChild(label);

  return host;
}

function createBadgeHost(tierClass: string): {
  host: HTMLDivElement;
  shadow: ShadowRoot;
} {
  const host = document.createElement("div");
  host.setAttribute(BADGE_ATTR, "true");
  host.className = `${BADGE_CLASS} ${tierClass}`;
  const shadow = host.attachShadow({ mode: "closed" });
  return { host, shadow };
}

function createBadgeStyle(
  accent: string,
  display: BadgeDisplayOptions,
): HTMLStyleElement {
  const hostWidth = display.fullWidth ? "100%" : "auto";
  const hostDisplay = display.fullWidth ? "block" : "inline-block";
  const innerWidth = display.fullWidth ? "100%" : "auto";
  const innerDisplay = display.fullWidth ? "block" : "inline";

  const style = document.createElement("style");
  style.textContent = `
    :host {
      display: ${hostDisplay};
      width: ${hostWidth};
      max-width: 100%;
      box-sizing: border-box;
      margin: ${display.hostMargin};
      overflow: visible;
      font-family: ${display.fontFamily};
      font-size: ${display.fontSizePx}px;
      font-weight: ${display.fontWeight};
      line-height: 1.4;
    }
    .badge,
    .badge-row {
      box-sizing: border-box;
      width: ${innerWidth};
      padding: ${display.padding};
      border-radius: ${display.borderRadiusPx}px;
      background: ${scoreBadgeBackground(accent)};
      color: ${accent};
      border: 1px solid ${scoreBadgeBorder(accent)};
      font: inherit;
      line-height: inherit;
      cursor: pointer;
    }
    .badge {
      display: ${innerDisplay};
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .badge-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .vivino-link {
      flex: 1 1 auto;
      min-width: 0;
      display: block;
      padding: 0;
      border: none;
      background: none;
      color: inherit;
      font: inherit;
      line-height: inherit;
      text-decoration: none;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      cursor: pointer;
      transition: opacity 150ms ease;
    }
    .vivino-link:hover {
      opacity: 0.9;
    }
    .vivino-link:focus-visible,
    ::slotted(a:focus-visible) {
      outline: 2px solid #fbbf24;
      outline-offset: 2px;
    }
    .star {
      color: ${scoreStarColor()};
    }
    .name {
      font: inherit;
      color: inherit;
    }
    @media (prefers-reduced-motion: reduce) {
      .vivino-link {
        transition: none;
      }
    }
  `;
  return style;
}

/** Build inner HTML for matched badge (exported for tests). */
export function buildBadgeMarkup(
  score: string | null,
  reviewCount: number | null,
  wineName: string,
  scoreScope: ScoreScope = "vintage",
): string {
  let reviews = "";
  if (score) {
    if (scoreScope === "all_vintages") {
      reviews = " (All Vintage)";
    } else if (reviewCount && reviewCount > 0) {
      reviews = ` (${reviewCount.toLocaleString()})`;
    }
  }
  const scoreText = score ? `${escapeHtml(score)}${reviews}` : "N/A";
  return `<span class="star" aria-hidden="true">★</span> ${scoreText} <span class="name">— ${escapeHtml(wineName)}</span>`;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildTooltip(
  wineName: string,
  reviewCount: number | null,
  scoreScope: ScoreScope = "vintage",
): string {
  if (scoreScope === "all_vintages") {
    return `${wineName} · All vintages average on Vivino`;
  }
  if (reviewCount && reviewCount > 0) {
    return `${wineName} · ${reviewCount.toLocaleString()} reviews on Vivino`;
  }
  return wineName;
}

function removeExistingBadge(
  element: Element,
  badgeAdapter: BadgeAdapter,
): void {
  const card = badgeAdapter.findProductCard(element);
  card
    ?.querySelectorAll(`[${BADGE_ATTR}]`)
    .forEach((node) => node.remove());
}

export function injectBadgeStyles(): void {
  if (document.getElementById("drink-good-styles")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "drink-good-styles";
  style.textContent = `
    [${BADGE_ATTR}] {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: none !important;
      box-shadow: none !important;
      box-sizing: border-box !important;
      position: relative !important;
      z-index: 3 !important;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);
}
