import { describe, expect, it } from "vitest";
import { cotedorBadgeAdapter } from "../../src/adapters/cotedor-badge";

const BADGE_ATTR = "data-drink-good-badge";

describe("cotedorBadgeAdapter", () => {
  it("places the badge above the listing price", () => {
    document.body.innerHTML = `
      <div class="product-small col type-product">
        <div class="box-text">
          <div class="title-wrapper">
            <p class="woocommerce-loop-product__title">
              <a>2014 Chateau Valandraud 6x75cl</a>
            </p>
          </div>
          <div class="price-wrapper"><span class="price">HK$5,700</span></div>
        </div>
      </div>
    `;

    const card = document.querySelector(".type-product")!;
    const title = card.querySelector("p.woocommerce-loop-product__title")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    cotedorBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: card,
    });

    expect(badgeHost.nextElementSibling?.classList.contains("price-wrapper")).toBe(true);
    expect(badgeHost.previousElementSibling?.classList.contains("title-wrapper")).toBe(
      true,
    );
  });

  it("places the badge above the product summary price", () => {
    document.body.innerHTML = `
      <h1 class="product_title">2014 Chateau Valandraud 6x75cl</h1>
      <div class="product-info summary entry-summary product-summary">
        <div class="hub-product-icons">RP94</div>
        <div class="price-wrapper"><span class="price">HK$5,700</span></div>
      </div>
    `;

    const title = document.querySelector("h1.product_title")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    cotedorBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: null,
    });

    const summary = document.querySelector(".product-summary")!;
    expect(badgeHost.parentElement).toBe(summary);
    expect(badgeHost.nextElementSibling?.classList.contains("price-wrapper")).toBe(true);
  });
});
