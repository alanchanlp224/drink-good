/**
 * E2E — RNG Wine first wine badge.
 * Injects Shopline product-item fixture on live category page.
 */

import { expect, test } from "./fixtures";

const RNG_WINE_URL = "https://www.rngwine.com/categories/red-wine-bordeaux";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

/** Live RNG listing layout — Shopline product-item with .title. */
const RNG_FIXTURE = `
  <div class="product-item">
    <product-item>
      <a class="Product-item" href="https://www.rngwine.com/products/chateau-lynch-bages-2019-fixture">
        <div class="info-box">
          <div class="info-box-inner-wrapper">
            <div class="title text-primary-color">Château Lynch-Bages 2019</div>
            <div class="quick-cart-price">
              <div class="price__regular">
                <span class="sl-price">HK$790.00</span>
              </div>
            </div>
          </div>
        </div>
      </a>
    </product-item>
  </div>
`;

test.describe("RNG Wine first wine", () => {
  test("loads extension, processes injected product item, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(RNG_WINE_URL, { waitUntil: "domcontentloaded" });
    await expect(page.locator(TRIGGER)).toBeVisible({ timeout: 30_000 });

    await page.evaluate((html) => {
      const root =
        document.querySelector(".ProductList-list, .ProductList-content") ??
        document.body;
      const mount = document.createElement("div");
      mount.id = "drink-good-rng-fixture";
      mount.innerHTML = html;
      root.prepend(mount);
      document.documentElement.dataset.drinkGoodMaxProducts = "1";
    }, RNG_FIXTURE);

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
