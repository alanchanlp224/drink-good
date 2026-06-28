/** Vivino search orchestration in the extension service worker. */

import { VivinoClient } from "../vivino/client";
import type { VivinoMatchResult } from "../vivino/types";

export class VivinoService {
  private readonly client: VivinoClient;
  private searchQueue: Promise<void> = Promise.resolve();

  constructor(client?: VivinoClient) {
    this.client =
      client ??
      new VivinoClient({
        countryCode: "hk",
        currencyCode: "HKD",
        minRequestIntervalMs: 500,
      });
  }

  get cacheSize(): number {
    return this.client.cacheSize();
  }

  clearCache(): void {
    this.client.clearCache();
  }

  /** Queue searches sequentially to respect rate limits. */
  searchWine(wineTitle: string): Promise<VivinoMatchResult> {
    const task = this.searchQueue.then(() => this.client.searchWine(wineTitle));
    this.searchQueue = task.then(
      () => undefined,
      () => undefined,
    );
    return task;
  }
}

let singleton: VivinoService | null = null;

export function getVivinoService(): VivinoService {
  if (!singleton) {
    singleton = new VivinoService();
  }
  return singleton;
}

/** Test hook — reset singleton between unit tests. */
export function resetVivinoServiceForTests(): void {
  singleton = null;
}
