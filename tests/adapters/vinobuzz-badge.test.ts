import { describe, expect, it } from "vitest";
import { vinobuzzBadgeAdapter } from "../../src/adapters/vinobuzz-badge";

const BADGE_ATTR = "data-drink-good-badge";

describe("vinobuzzBadgeAdapter", () => {
  it("places the badge above the listing price", () => {
    document.body.innerHTML = `
      <a class="wine-card wine-card--nora2-layout">
        <div class="wine-bottom-overview">
          <h3 class="wine-name wine-name--nora2">Clos Mogador 'Com Tu' 2021</h3>
        </div>
        <div class="wine-actions">
          <div class="price-section price-section--figma">
            <span class="price">HK$ 456</span>
          </div>
        </div>
      </a>
    `;

    const card = document.querySelector("a.wine-card")!;
    const title = card.querySelector("h3.wine-name")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    vinobuzzBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: card,
    });

    expect(badgeHost.nextElementSibling?.classList.contains("price-section")).toBe(true);
    expect(badgeHost.parentElement?.classList.contains("wine-actions")).toBe(true);
  });

  it("places the badge above the product page price row", () => {
    document.body.innerHTML = `
      <h1 class="wine-title">Clos Mogador 'Com Tu' 2021</h1>
      <div class="rating-price-row">
        <div class="price-section overview-price"><span class="price">HK$1,050</span></div>
      </div>
    `;

    const title = document.querySelector("h1.wine-title")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    vinobuzzBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: null,
    });

    expect(badgeHost.nextElementSibling?.classList.contains("rating-price-row")).toBe(true);
  });
});
