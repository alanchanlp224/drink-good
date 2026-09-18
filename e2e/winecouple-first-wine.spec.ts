/**
 * E2E — Wine Couple French terroir collection, first product badge only.
 * Requires network (winecouple.hk + Vivino) and a built extension in dist/.
 */

import { expect, test } from "./fixtures";

const WINECOUPLE_URL =
  "https://www.winecouple.hk/categories/frenchwines-terroircollection";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

test.describe("Wine Couple first wine", () => {
  test("loads extension, processes first wine, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(WINECOUPLE_URL, { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".ProductList-list div.product-item .info-box .title").first(),
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
