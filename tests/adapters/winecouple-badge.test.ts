import { describe, expect, it } from "vitest";
import { winecoupleBadgeAdapter } from "../../src/adapters/winecouple-badge";

const BADGE_ATTR = "data-drink-good-badge";

describe("winecoupleBadgeAdapter", () => {
  it("places badge above the listing price", () => {
    document.body.innerHTML = `
      <div class="product-item">
        <div class="info-box">
          <div class="info-box-inner-wrapper">
            <div class="title text-primary-color">Chateau du Closet Bordeaux Rouge 2020</div>
            <div class="quick-cart-price">
              <div class="price-sale">HK$468.00</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const card = document.querySelector("div.product-item")!;
    const title = card.querySelector(".title")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    winecoupleBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: card,
    });

    expect(badgeHost.nextElementSibling?.classList.contains("quick-cart-price")).toBe(
      true,
    );
    expect(badgeHost.previousElementSibling?.classList.contains("title")).toBe(true);
  });

  it("places badge after the product detail title", () => {
    document.body.innerHTML = `
      <div class="box-default">
        <h1 class="Product-title">Chateau du Closet Bordeaux Rouge 2020</h1>
        <p class="Product-summary">$99/支優惠套裝</p>
      </div>
    `;

    const title = document.querySelector("h1.Product-title")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    winecoupleBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: document.querySelector(".box-default"),
    });

    expect(badgeHost.previousElementSibling?.classList.contains("Product-title")).toBe(
      true,
    );
    expect(badgeHost.nextElementSibling?.classList.contains("Product-summary")).toBe(
      true,
    );
  });
});
