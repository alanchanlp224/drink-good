import { describe, expect, it } from "vitest";
import { ginsbergchanBadgeAdapter } from "../../src/adapters/ginsbergchan-badge";

const BADGE_ATTR = "data-drink-good-badge";

describe("ginsbergchanBadgeAdapter", () => {
  it("places the badge above the Boost grid price", () => {
    document.body.innerHTML = `
      <div class="boost-pfs-filter-product-item">
        <div class="boost-pfs-filter-product-bottom-inner">
          <a class="boost-pfs-filter-product-item-title">00 Wines 'Richard Hermann Cuvee' Pinot Noir 2021</a>
          <p class="boost-pfs-filter-product-item-vendor">Red</p>
          <p class="boost-pfs-filter-product-item-price">HKD $1,950</p>
        </div>
      </div>
    `;

    const card = document.querySelector(".boost-pfs-filter-product-item")!;
    const title = card.querySelector("a.boost-pfs-filter-product-item-title")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    ginsbergchanBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: card,
    });

    expect(
      badgeHost.nextElementSibling?.classList.contains(
        "boost-pfs-filter-product-item-price",
      ),
    ).toBe(true);
  });

  it("places the badge above the product detail price", () => {
    document.body.innerHTML = `
      <div class="product-single__meta">
        <div class="product-block product-block--header">
          <h1 class="product-single__title">00 Wines 'Richard Hermann Cuvee' Pinot Noir 2021</h1>
        </div>
        <div>
          <div class="product-block product-block--price">HKD $1,950.00</div>
        </div>
      </div>
    `;

    const title = document.querySelector("h1.product-single__title")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    ginsbergchanBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: document.querySelector(".product-single__meta"),
    });

    expect(badgeHost.nextElementSibling?.classList.contains("product-block--price")).toBe(
      true,
    );
  });
});
