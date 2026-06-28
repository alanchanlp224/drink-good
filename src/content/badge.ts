/** In-page Vivino score badge overlay. */

import type { BadgeAdapter, BadgeDisplayOptions } from "../core/badge-display";
import {
  getScoreStyle,
  scoreBadgeBackground,
  scoreBadgeBorder,
  scoreStarColor,
} from "../shared/score-style";
import { formatVivinoScore } from "../vivino/similarity";
import type { VivinoMatchResult } from "../vivino/types";

const BADGE_CLASS = "drink-good-badge";
const BADGE_ATTR = "data-drink-good-badge";

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
): void {
  badgeAdapter.insertBadge({
    anchorElement,
    badgeHost,
    productCard: badgeAdapter.findProductCard(anchorElement),
  });
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
  const vivinoUrl = result.candidate.vivinoUrl;

  const { host, shadow } = createBadgeHost(`${BADGE_CLASS}--${style.id}`);

  const link = document.createElement("a");
  link.href = vivinoUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = buildTooltip(wineName, reviewCount);
  link.innerHTML = buildBadgeMarkup(score, reviewCount, wineName);
  link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.open(vivinoUrl, "_blank", "noopener,noreferrer");
  });

  shadow.appendChild(createBadgeStyle(style.accent, display));
  shadow.appendChild(link);

  return host;
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
    a {
      display: ${innerDisplay};
      width: ${innerWidth};
      box-sizing: border-box;
      padding: ${display.padding};
      border-radius: ${display.borderRadiusPx}px;
      background: ${scoreBadgeBackground(accent)};
      color: ${accent};
      border: 1px solid ${scoreBadgeBorder(accent)};
      font: inherit;
      line-height: inherit;
      text-decoration: none;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: break-word;
      cursor: pointer;
      transition: opacity 150ms ease;
    }
    a:hover {
      opacity: 0.9;
    }
    a:focus-visible {
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
      a {
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
): string {
  const reviews =
    reviewCount && reviewCount > 0 ? ` (${reviewCount.toLocaleString()})` : "";
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
): string {
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
    }
  `;
  document.head.appendChild(style);
}
