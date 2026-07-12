/**
 * E2E — King's Wine Cellar Bordeaux collection, first product badge only.
 * Requires network (kingswine.hk + Vivino) and a built extension in dist/.
 */

import { expect, test } from "./fixtures";

const KINGSWINE_URL = "https://kingswine.hk/collections/bordeaux";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

test.describe("King's Wine Cellar first wine", () => {
  test("loads extension, processes first wine, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(KINGSWINE_URL, { waitUntil: "networkidle" });
    await expect(
      page.locator("#CollectionAjaxContent .grid-product[data-product-id] .grid-product__title").first(),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.locator(TRIGGER)).toBeVisible({ timeout: 30_000 });

    await page.evaluate(() => {
      document.documentElement.dataset.drinkGoodMaxProducts = "1";
      for (const node of document.querySelectorAll(
        ".smile-launcher-frame, #smile-ui-container, iframe[title*='loyalty']",
      )) {
        node.remove();
      }
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
