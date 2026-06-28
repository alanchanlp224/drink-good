/** Page processor — extract wines, query Vivino, render badges. */

import type { RetailerAdapter } from "../core/adapter";
import type { ProductCandidate } from "../core/adapter";
import { sendBackgroundRequest } from "../shared/runtime";
import { hasBadge, renderBadge, shouldSuppressMutationHandling } from "./badge";

export class PageProcessor {
  private running = false;
  private observer: MutationObserver | null = null;
  private activeChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly adapter: RetailerAdapter,
    private readonly maxProducts = Number.POSITIVE_INFINITY,
  ) {}

  /** Optional E2E cap via `data-drink-good-max-products` on `<html>`. */
  private resolveMaxProducts(): number {
    const raw = document.documentElement.dataset.drinkGoodMaxProducts;
    if (raw) {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return this.maxProducts;
  }

  isRunning(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    await this.log("info", `Started processing on ${this.adapter.displayName}`);
    await this.setProcessingState("running", 0, 0);
    this.startObserver();
    await this.processVisible();
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }
    this.running = false;
    this.stopObserver();
    await this.log("info", "Processing stopped by user");
    await this.setProcessingState("stopped", 0, 0);
  }

  async toggle(): Promise<void> {
    if (this.running) {
      await this.stop();
    } else {
      await this.start();
    }
  }

  private startObserver(): void {
    if (this.observer) {
      return;
    }

    const target =
      document.querySelector("ul.products, .products, main, #content") ??
      document.body;

    this.observer = new MutationObserver(() => {
      if (!this.running || shouldSuppressMutationHandling()) {
        return;
      }
      void this.enqueueProcess();
    });

    this.observer.observe(target, { childList: true, subtree: true });
  }

  private stopObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private enqueueProcess(): void {
    this.activeChain = this.activeChain.then(() => this.processVisible());
  }

  private async processVisible(): Promise<void> {
    if (!this.running) {
      return;
    }

    const products = this.adapter
      .extractProducts()
      .filter((product) => !hasBadge(product.element, this.adapter.badge))
      .slice(0, this.resolveMaxProducts());

    if (products.length === 0) {
      return;
    }

    await this.log("debug", `Extracted ${products.length} new product(s)`);

    let processed = 0;
    const total = products.length;
    await this.setProcessingState("running", 0, total);

    for (const product of products) {
      if (!this.running) {
        break;
      }
      try {
        await this.processProduct(product);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown processing error";
        await this.log("error", `Failed on "${product.rawTitle}": ${message}`);
      }
      processed += 1;
      await this.setProcessingState("running", processed, total);
    }
  }

  private async processProduct(product: ProductCandidate): Promise<void> {
    const normalized = this.adapter.normalizeTitle(product.rawTitle);
    await this.log(
      "debug",
      `Normalize: "${product.rawTitle}" → search="${normalized.searchText}" vintage=${normalized.vintage ?? "n/a"}`,
    );

    const response = await sendBackgroundRequest({
      type: "VIVINO_SEARCH",
      wineTitle: product.rawTitle,
      adapterId: this.adapter.id,
    });

    if (response.type === "VIVINO_RESULT") {
      renderBadge(product.element, response.result, this.adapter.badge);
    }
  }

  private async setProcessingState(
    status: "running" | "stopped" | "idle",
    processed: number,
    total: number,
  ): Promise<void> {
    await sendBackgroundRequest({
      type: "SET_PROCESSING_STATE",
      status,
      processed,
      total,
    });
  }

  private async log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
  ): Promise<void> {
    await sendBackgroundRequest({ type: "LOG", level, message });
  }
}
