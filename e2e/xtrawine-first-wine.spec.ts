/**
 * E2E — XtraWine red wine collection, first product badge only.
 * Requires network (XtraWine Algolia grid + Vivino) and a built extension in dist/.
 */

import { expect, test } from "./fixtures";

const XTRAWINE_URL = "https://www.xtrawine.com/collections/red-wines";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

test.describe("XtraWine first wine", () => {
  test("loads extension, processes first wine, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(XTRAWINE_URL, { waitUntil: "networkidle" });
    await expect(
      page.locator("li.grid__item[data-product-id] .grid-product-title").first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(TRIGGER)).toBeVisible({ timeout: 30_000 });

    await page.evaluate(() => {
      document.documentElement.dataset.drinkGoodMaxProducts = "1";
    });

    await page.locator(TRIGGER).click();
    await expect(page.locator(TRIGGER)).toHaveClass(/drink-good-running/);

    const firstBadge = page.locator(BADGE).first();
    await expect(firstBadge).toBeVisible({ timeout: 90_000 });

    await expect(page.locator(TRIGGER)).not.toHaveClass(/drink-good-running/);

    const className = await firstBadge.getAttribute("class");
    expect(className).toMatch(MATCHED_OR_UNKNOWN);

    await expect(page.locator(BADGE)).toHaveCount(1);
  });
});
