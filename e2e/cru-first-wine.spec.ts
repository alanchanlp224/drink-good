/**
 * E2E — Cru Markets first wine badge.
 * Cru's Angular app often blocks headless API calls; we inject a desktop mat-table
 * fixture on the live domain so adapter extraction + Vivino lookup are exercised.
 * Cru switches to mobile card layout at ≤960px — desktop viewport is required.
 */

import { expect, test } from "./fixtures";

const CRU_MARKETS_URL = "https://markets.cruworldwine.com/hk/popular-markets";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN =
  /drink-good-badge--(excellent|fair|low|unknown)/;

/** Desktop app-web-data mat-table row — matches live Cru popular-markets layout. */
const CRU_DESKTOP_TABLE_FIXTURE = `
  <mat-table>
    <mat-row class="mat-row">
      <mat-cell class="mat-column-wine-name">
        <div class="wine-name">
          <a href="/hk/product/lynch-bages">Château Lynch-Bages</a>
        </div>
      </mat-cell>
      <mat-cell class="mat-column-vintage">2019</mat-cell>
      <mat-cell class="mat-column-pack_size">6x75cl</mat-cell>
    </mat-row>
  </mat-table>
`;

test.describe("Cru Markets first wine", () => {
  test("loads extension, processes injected desktop table row, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(CRU_MARKETS_URL, { waitUntil: "domcontentloaded" });
    await expect(page.locator(TRIGGER)).toBeVisible({ timeout: 30_000 });

    await page.evaluate((html) => {
      const root = document.querySelector("app-root") ?? document.body;
      const mount = document.createElement("div");
      mount.id = "drink-good-cru-fixture";
      mount.innerHTML = html;
      root.appendChild(mount);
      document.documentElement.dataset.drinkGoodMaxProducts = "1";
    }, CRU_DESKTOP_TABLE_FIXTURE);

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
