/** Registry of retailer adapters — add new shops here. */

import type { RetailerAdapter } from "./adapter";
import { wineviewAdapter } from "../adapters/wineview";

const adapters: RetailerAdapter[] = [wineviewAdapter];

export function getAdapterForUrl(url: string): RetailerAdapter | null {
  return adapters.find((adapter) => adapter.matchesUrl(url)) ?? null;
}

export function listAdapters(): RetailerAdapter[] {
  return [...adapters];
}
