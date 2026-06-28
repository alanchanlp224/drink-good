/** Content script — retailer detection, badges, floating button. */

import { getAdapterForUrl } from "../core/adapter-registry";
import { injectBadgeStyles } from "./badge";
import { mountFloatingButton } from "./floating-button";
import { PageProcessor } from "./processor";

function init(): void {
  const adapter = getAdapterForUrl(window.location.href);
  if (!adapter) {
    return;
  }

  injectBadgeStyles();
  document.documentElement.dataset.drinkGoodAdapter = adapter.id;

  const processor = new PageProcessor(adapter);
  mountFloatingButton(processor);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
