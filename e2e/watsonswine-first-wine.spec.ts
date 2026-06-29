/**
 * E2E — Watson's Wine first wine badge.
 * Akamai blocks headless product render; inject ww-product-tile fixture on live domain.
 */

import { expect, test } from "./fixtures";

const WATSONS_WINE_URL = "https://www.watsonswine.com/en/c/10010231";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

/** Live Watson's listing layout — ww-product-tile with a.product-name. */
const WATSONS_GRID_FIXTURE = `
  <ww-product-list>
    <ww-product-tile>
      <div class="product-container">
        <div class="product-info">
          <a class="product-name" href="/en/wine/chateau-lynch-bages-2019/p/BP_TEST">
            <span class="brand">CHÂTEAU LYNCH-BAGES</span>
            <span class="name">Château Lynch-Bages 2019</span>
          </a>
          <ww-product-price>
            <div class="price-container new-price"><span>$790</span></div>
          </ww-product-price>
        </div>
      </div>
    </ww-product-tile>
  </ww-product-list>
`;

test.describe("Watson's Wine first wine", () => {
  test("loads extension, processes injected grid item, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(WATSONS_WINE_URL, { waitUntil: "domcontentloaded" });
    await expect(page.locator(TRIGGER)).toBeVisible({ timeout: 30_000 });

    await page.evaluate((html) => {
      const root = document.querySelector("cx-storefront, app-root") ?? document.body;
      const mount = document.createElement("div");
      mount.id = "drink-good-watsons-fixture";
      mount.innerHTML = html;
      root.appendChild(mount);
      document.documentElement.dataset.drinkGoodMaxProducts = "1";
    }, WATSONS_GRID_FIXTURE);

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
