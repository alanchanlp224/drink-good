/** Per-retailer adapter contract — each wine shop implements this interface. */

import type { BadgeAdapter } from "./badge-display";
import type { NormalizedQuery } from "../vivino/types";

export interface ProductCandidate {
  /** Stable id for deduplication within a page session. */
  id: string;
  /** Raw product title from the shop DOM. */
  rawTitle: string;
  /** Element to attach badge overlay (content script context). */
  element: Element;
}

export interface FloatingTriggerOptions {
  /** Distance from viewport bottom in px (default 24). */
  bottomPx?: number;
  /** Distance from viewport right in px (default 24). */
  rightPx?: number;
  /** Measure this element at runtime and sit the FAB above it. */
  stackAboveSelector?: string;
  /** Gap between FAB bottom edge and obstacle top (default 16). */
  stackGapPx?: number;
}

export interface RetailerAdapter {
  id: string;
  displayName: string;
  urlPatterns: string[];
  matchesUrl(url: string): boolean;
  extractProducts(root?: Document): ProductCandidate[];
  normalizeTitle(rawTitle: string): NormalizedQuery;
  /** Per-site badge placement and styling. */
  badge: BadgeAdapter;
  /** Optional FAB offset when site widgets overlap the default corner. */
  floatingTrigger?: FloatingTriggerOptions;
}
