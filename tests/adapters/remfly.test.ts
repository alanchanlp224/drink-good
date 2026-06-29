import { afterEach, describe, expect, it } from "vitest";
import { remflyAdapter } from "../../src/adapters/remfly";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("remflyAdapter", () => {
  it("matches Remfly URLs", () => {
    expect(
      remflyAdapter.matchesUrl(
        "https://remfly.com.hk/product/promotion/p?pf=all",
      ),
    ).toBe(true);
    expect(
      remflyAdapter.matchesUrl(
        "https://www.remfly.com.hk/product/W_PROMO_RG029217DAA12/slug",
      ),
    ).toBe(true);
    expect(remflyAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
  });

  it("extracts English vintage line from visible product-cardimg titles", () => {
    document.body.innerHTML = `
      <div class="product-cardcontainer">
        <a class="product-cardimg" href="/product/W_PROMO_RG029217DAA12/slug">
          <p class="montserrat rem-text-16 text-remdark list-none px-3">【12支】太保副牌紅葡萄酒 2017</p>
          <p class="montserrat rem-text-16 text-remdark list-none px-3">【12 bts】Connetable de Talbot 2017</p>
          <p class="montserrat rem-text-16 text-remdark list-none px-3">75cl x 12</p>
          <div class="px-3">
            <div class="list-none">
              <div class="price-container"><p>HK$2280.00</p></div>
            </div>
          </div>
        </a>
        <div class="adminProductCartForm product-cardcontent">
          <p class="montserrat rem-text-16 text-remdark grid-none">【12支】太保副牌紅葡萄酒 2017</p>
          <p class="montserrat rem-text-16 text-remdark grid-none">【12 bts】Connetable de Talbot 2017</p>
        </div>
      </div>
      <div class="product-cardcontainer">
        <a class="product-cardimg" href="/product/W_PROMO_RF041207DAA6/slug">
          <p class="list-none px-3">【6支】康特梅爾堡紅葡萄酒 2007</p>
          <p class="list-none px-3">【6 bts】Ch. Cantemerle 2007</p>
          <p class="list-none px-3">75cl x 6</p>
        </a>
      </div>
    `;

    const products = remflyAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe("Connetable de Talbot 2017");
    expect(products[0]?.element.classList.contains("list-none")).toBe(true);
    expect(products[1]?.rawTitle).toBe("Chateau Cantemerle 2007");
  });

  it("extracts product detail page title from h1", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/product/W_PROMO_RG029217DAA12/12-btsconnetable-de-talbot-2017",
      },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <h1 class="montserrat text-remdark rem-text-36">【12 bts】Connetable de Talbot 2017</h1>
      <div class="product-cardcontainer">
        <p class="grid-none">Should not extract on PDP</p>
      </div>
    `;

    const products = remflyAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("Connetable de Talbot 2017");
  });

  it("normalizes vintage for Vivino search", () => {
    const query = remflyAdapter.normalizeTitle(
      "【12 bts】Connetable de Talbot 2017",
    );
    expect(query.searchText).toBe("Connetable de Talbot");
    expect(query.vintage).toBe(2017);
  });
});
