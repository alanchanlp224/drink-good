/**
 * Live E2E — Wineview red wine listing, first product badge only.
 * Requires network (Wineview + Vivino) and a built extension in dist/.
 */

import { expect, test } from "./fixtures";

const WINVIEW_RED_WINE_URL =
  "https://wineview.com.hk/product-category/wine-shop/red-wine/";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

test.describe("Wineview first wine", () => {
  test("loads extension, processes first wine, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(WINVIEW_RED_WINE_URL, { waitUntil: "domcontentloaded" });
    await expect(page.locator("li.product").first()).toBeVisible();
    await expect(page.locator(TRIGGER)).toBeVisible();

    await page.evaluate(() => {
      document.documentElement.dataset.drinkGoodMaxProducts = "1";
    });

    await page.locator(TRIGGER).click();
    await expect(page.locator(TRIGGER)).toHaveClass(/drink-good-running/);

    const firstBadge = page.locator(BADGE).first();
    await expect(firstBadge).toBeVisible({ timeout: 90_000 });

    await page.locator(TRIGGER).click();
    await expect(page.locator(TRIGGER)).not.toHaveClass(/drink-good-running/);

    const className = await firstBadge.getAttribute("class");
    expect(className).toMatch(MATCHED_OR_UNKNOWN);

    await expect(page.locator(BADGE)).toHaveCount(1);
  });
});
