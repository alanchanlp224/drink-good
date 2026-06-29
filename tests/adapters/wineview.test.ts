import { describe, expect, it } from "vitest";
import { wineviewAdapter } from "../../src/adapters/wineview";

describe("wineviewAdapter", () => {
  it("matches wineview URLs", () => {
    expect(
      wineviewAdapter.matchesUrl(
        "https://wineview.com.hk/product-category/wine-shop/red-wine/",
      ),
    ).toBe(true);
    expect(wineviewAdapter.matchesUrl("https://www.wineview.com.hk/")).toBe(
      true,
    );
    expect(wineviewAdapter.matchesUrl("https://example.com/")).toBe(false);
  });

  it("extracts listing products from WooCommerce HTML", () => {
    document.body.innerHTML = `
      <ul class="products">
        <li class="product">
          <h2 class="woocommerce-loop-product__title">Chateau Lynch Bages 2019</h2>
        </li>
        <li class="product">
          <h2 class="woocommerce-loop-product__title">Sale! Geoff Merrill Reserve Shiraz 2016</h2>
        </li>
      </ul>
    `;

    const products = wineviewAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe("Chateau Lynch Bages 2019");
    expect(products[0]?.element.tagName).toBe("H2");
    expect(products[1]?.rawTitle).toContain("Geoff Merrill");
  });

  it("normalizes sale prefix and vintage", () => {
    const query = wineviewAdapter.normalizeTitle(
      "Sale! Geoff Merrill Reserve Shiraz 2016",
    );
    expect(query.searchText).not.toMatch(/sale/i);
    expect(query.vintage).toBe(2016);
  });

  it("does not strip parenthetical text (retailer-specific rules)", () => {
    const query = wineviewAdapter.normalizeTitle(
      "Chateau Lynch Bages 2019 (Grand Cru Classé)",
    );
    expect(query.searchText).toMatch(/\(Grand Cru/i);
  });
});
