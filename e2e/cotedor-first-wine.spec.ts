/**
 * E2E — Cote d'Or Fine Wines Bordeaux search, first product badge only.
 * Requires network (cotedorfinewines.com + Vivino) and a built extension in dist/.
 */

import { expect, test } from "./fixtures";

const COTEDOR_URL =
  "https://cotedorfinewines.com/fine-wine/?adv_search=wc&post_type=product&relation=AND&tax%5B0%5D=pa_region&tax%5B1%5D=none&tax%5B2%5D=none&tax%5B3%5D=none&op%5B0%5D=IN&op%5B1%5D=IN&op%5B2%5D=IN&op%5B3%5D=IN&val%5B0%5D=bordeaux&val%5B1%5D=0&val%5B2%5D=0&val%5B3%5D=0";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

test.describe("Cote d'Or Fine Wines first wine", () => {
  test("loads extension, processes first wine, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(COTEDOR_URL, { waitUntil: "domcontentloaded" });
    await expect(
      page.locator(".shop-container p.woocommerce-loop-product__title").first(),
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
