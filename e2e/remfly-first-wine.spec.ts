/**
 * E2E — Remfly first wine badge.
 * Injects product-cardcontainer fixture on live promotion listing.
 */

import { expect, test } from "./fixtures";

const REMFLY_URL = "https://remfly.com.hk/product/promotion/p?pf=all";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

/** Live Remfly listing layout — English title line in product card. */
const REMFLY_FIXTURE = `
  <div class="product-cardcontainer">
    <a class="product-cardimg" href="https://remfly.com.hk/product/W_TEST/chateau-lynch-bages-2019">
      <p class="montserrat rem-text-16 text-remdark list-none px-3">【6支】靚次伯紅葡萄酒 2019</p>
      <p class="montserrat rem-text-16 text-remdark list-none px-3">Château Lynch-Bages 2019</p>
      <p class="montserrat rem-text-16 text-remdark list-none px-3">75cl x 6</p>
      <div class="px-3">
        <div class="list-none">
          <div class="flex flex-wrap items-center price-container">
            <p class="montserrat-bold"><span>HK$</span><span>2280.<span>00</span></span></p>
          </div>
        </div>
      </div>
    </a>
    <div class="adminProductCartForm product-cardcontent">
      <p class="grid-none">Château Lynch-Bages 2019</p>
      <a class="price-container grid-none">HK$2280.00</a>
    </div>
  </div>
`;

test.describe("Remfly first wine", () => {
  test("loads extension, processes injected product card, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(REMFLY_URL, { waitUntil: "domcontentloaded" });
    await expect(page.locator(TRIGGER)).toBeVisible({ timeout: 30_000 });

    await page.evaluate((html) => {
      const root =
        document.querySelector(".adminProductList, .product-container") ??
        document.body;
      const mount = document.createElement("div");
      mount.id = "drink-good-remfly-fixture";
      mount.innerHTML = html;
      root.prepend(mount);
      document.documentElement.dataset.drinkGoodMaxProducts = "1";
    }, REMFLY_FIXTURE);

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
