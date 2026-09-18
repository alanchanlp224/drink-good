/**
 * E2E — Ginsberg+Chan red collection, first product badge only.
 * Requires network (ginsbergchan.com + Vivino) and a built extension in dist/.
 */

import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const GINSBERGCHAN_URL = "https://ginsbergchan.com/collections/red";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

async function dismissAgeGate(page: Page): Promise<void> {
  const yes = page
    .frameLocator('iframe[id^="AgeShopifyKaktusApp"]')
    .getByText(/Yes, I.?m over 18/i);
  try {
    await yes.click({ timeout: 8_000 });
  } catch {
    // Gate already dismissed, or this visit did not show it.
  }
}

test.describe("Ginsberg+Chan first wine", () => {
  test("loads extension, processes first wine, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(GINSBERGCHAN_URL, { waitUntil: "domcontentloaded" });
    await dismissAgeGate(page);
    await expect(
      page.locator("a.boost-pfs-filter-product-item-title").first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(TRIGGER)).toBeVisible({ timeout: 30_000 });

    await page.evaluate(() => {
      document.documentElement.dataset.drinkGoodMaxProducts = "1";
    });

    await page.locator(TRIGGER).click({ force: true });
    await expect(page.locator(TRIGGER)).toHaveClass(/drink-good-running/);

    const firstBadge = page.locator(BADGE).first();
    await expect(firstBadge).toBeVisible({ timeout: 90_000 });

    await expect(page.locator(TRIGGER)).not.toHaveClass(/drink-good-running/);

    const className = await firstBadge.getAttribute("class");
    expect(className).toMatch(MATCHED_OR_UNKNOWN);

    await expect(page.locator(BADGE)).toHaveCount(1);
  });
});
