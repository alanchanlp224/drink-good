import { describe, expect, it } from "vitest";
import { kingswineBadgeAdapter } from "../../src/adapters/kingswine-badge";

const BADGE_ATTR = "data-drink-good-badge";

describe("kingswineBadgeAdapter", () => {
  it("places badge above price in grid product meta", () => {
    document.body.innerHTML = `
      <div class="grid-product" data-product-id="4264988868662">
        <div class="grid-item__content">
          <div class="grid-item__meta">
            <div class="grid-item__meta-main">
              <div class="grid-product__title">
                <a class="grid-item__link" href="/products/example">2016 Penfolds Bin 707</a>
              </div>
            </div>
            <div class="grid-item__meta-secondary">
              <div class="grid-product__price">$3,680.00</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const card = document.querySelector(".grid-product[data-product-id]")!;
    const title = card.querySelector(".grid-product__title a.grid-item__link")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    kingswineBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: card,
    });

    expect(badgeHost.nextElementSibling?.classList.contains("grid-product__price")).toBe(
      true,
    );
    expect(badgeHost.parentElement?.classList.contains("grid-item__meta-secondary")).toBe(
      true,
    );
  });
});
