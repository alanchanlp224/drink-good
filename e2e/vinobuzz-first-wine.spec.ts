/**
 * E2E — VinoBuzz marketplace, first product badge only.
 * Requires network (vinobuzz.ai + Vivino) and a built extension in dist/.
 */

import { expect, test } from "./fixtures";

const VINOBUZZ_URL = "https://vinobuzz.ai/marketplace";

const TRIGGER = "#drink-good-trigger";
const BADGE = "[data-drink-good-badge]";
const MATCHED_OR_UNKNOWN = /drink-good-badge--(excellent|fair|low|unknown)/;

test.describe("VinoBuzz first wine", () => {
  test("loads extension, processes first wine, shows Vivino badge", async ({
    context,
  }) => {
    const page = await context.newPage();

    await page.goto(VINOBUZZ_URL, { waitUntil: "domcontentloaded" });
    const skipTour = page.getByRole("button", { name: /skip tour/i });
    if (await skipTour.isVisible().catch(() => false)) {
      await skipTour.click();
    }

    await expect(page.locator(".search-results-area h3.wine-name").first()).toBeVisible({
      timeout: 60_000,
    });
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

    const search = firstBadge.locator("[data-drink-good-wine-searcher]");
    if (className?.includes("unknown")) {
      await expect(search).toHaveCount(0);
    } else {
      await expect(search).toHaveCount(1);
      await expect(search).toHaveAttribute(
        "href",
        /https:\/\/www\.wine-searcher\.com\/find\/.+\/hong\+kong$/,
      );
    }

    await expect(page.locator(BADGE)).toHaveCount(1);
  });
});
