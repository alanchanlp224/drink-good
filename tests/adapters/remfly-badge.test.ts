import { describe, expect, it } from "vitest";
import { remflyBadgeAdapter } from "../../src/adapters/remfly-badge";

const BADGE_ATTR = "data-drink-good-badge";

describe("remflyBadgeAdapter", () => {
  it("places badge above the visible price section", () => {
    document.body.innerHTML = `
      <div class="product-cardcontainer">
        <a class="product-cardimg" href="/product/W_TEST/slug">
          <p class="montserrat rem-text-16 text-remdark list-none px-3">【12支】太保副牌紅葡萄酒 2017</p>
          <p class="montserrat rem-text-16 text-remdark list-none px-3">【12 bts】Connetable de Talbot 2017</p>
          <p class="montserrat rem-text-16 text-remdark list-none px-3">75cl x 12</p>
          <div class="px-3">
            <div class="list-none">
              <div class="flex flex-wrap items-center price-container">
                <p class="montserrat-bold">HK$2280.00</p>
              </div>
            </div>
          </div>
        </a>
        <div class="product-cardcontent">
          <p class="grid-none">【12 bts】Connetable de Talbot 2017</p>
          <a class="price-container grid-none">HK$2280.00</a>
        </div>
      </div>
    `;

    const card = document.querySelector(".product-cardcontainer")!;
    const title = card.querySelector("a.product-cardimg p.list-none:nth-of-type(2)")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    remflyBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: card,
    });

    const priceSection = card.querySelector(
      "a.product-cardimg > div.px-3:has(.price-container)",
    );
    expect(badgeHost.nextElementSibling).toBe(priceSection);
    expect(badgeHost.style.paddingLeft).toBe("0.75rem");
  });
});
