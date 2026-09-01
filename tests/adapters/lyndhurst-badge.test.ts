import { describe, expect, it } from "vitest";
import { lyndhurstBadgeAdapter } from "../../src/adapters/lyndhurst-badge";

const BADGE_ATTR = "data-drink-good-badge";

describe("lyndhurstBadgeAdapter", () => {
  it("falls back to appendChild when price is nested in hover block", () => {
    document.body.innerHTML = `
      <product-card data-product-id="7343393931344" class="product-card js-product-card">
        <div class="product-card__details">
          <a class="product-card__link" title="J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022">
            <h3 class="product-card__title">
              <product-card-title>J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022</product-card-title>
            </h3>
          </a>
          <div class="product-card__details__hover u-medium">
            <a class="product-card__link" tabindex="-1">
              <product-card-price class="price">
                <span class="price"><span class="money">HK$270</span></span>
              </product-card-price>
            </a>
          </div>
        </div>
      </product-card>
    `;

    const card = document.querySelector("product-card[data-product-id]")!;
    const title = card.querySelector("h3.product-card__title")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    expect(() =>
      lyndhurstBadgeAdapter.insertBadge({
        anchorElement: title,
        badgeHost,
        productCard: card,
      }),
    ).not.toThrow();

    expect(badgeHost.isConnected).toBe(true);
    expect(badgeHost.closest(".product-card__details__hover")).toBeNull();
    expect(
      badgeHost.previousElementSibling?.classList.contains("product-card__link"),
    ).toBe(true);
  });

  it("places badge before PDP price block", () => {
    document.body.innerHTML = `
      <product-single data-product-id="7343393931344" class="product-single js-product-single">
        <div class="product-single__box">
          <div class="product-single__box__block product-single__box__block--title">
            <h1 class="product-single__title">J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022</h1>
          </div>
          <div class="product-single__box__block product-single__box__block--price">
            <div class="price"><span class="money">HK$270</span></div>
          </div>
        </div>
      </product-single>
    `;

    const title = document.querySelector("h1.product-single__title")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    lyndhurstBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: document.querySelector("product-single")!,
    });

    expect(
      badgeHost.nextElementSibling?.classList.contains(
        "product-single__box__block--price",
      ),
    ).toBe(true);
  });
});
