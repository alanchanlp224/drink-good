/** Registry of retailer adapters — add new shops here. */

import type { RetailerAdapter } from "./adapter";
import { cruAdapter } from "../adapters/cru";
import { remflyAdapter } from "../adapters/remfly";
import { rngwineAdapter } from "../adapters/rngwine";
import { tencellarsAdapter } from "../adapters/tencellars";
import { watsonswineAdapter } from "../adapters/watsonswine";
import { wineviewAdapter } from "../adapters/wineview";

const adapters: RetailerAdapter[] = [
  wineviewAdapter,
  cruAdapter,
  watsonswineAdapter,
  rngwineAdapter,
  remflyAdapter,
  tencellarsAdapter,
];

export function getAdapterForUrl(url: string): RetailerAdapter | null {
  return adapters.find((adapter) => adapter.matchesUrl(url)) ?? null;
}

export function listAdapters(): RetailerAdapter[] {
  return [...adapters];
}
