import { afterEach, describe, expect, it } from "vitest";
import { rngwineAdapter } from "../../src/adapters/rngwine";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("rngwineAdapter", () => {
  it("matches RNG Wine URLs", () => {
    expect(
      rngwineAdapter.matchesUrl(
        "https://www.rngwine.com/categories/red-wine-bordeaux",
      ),
    ).toBe(true);
    expect(
      rngwineAdapter.matchesUrl("https://rngwine.com/products/chateau-latour-1981-1"),
    ).toBe(true);
    expect(rngwineAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
  });

  it("extracts Shopline listing products from .title", () => {
    document.body.innerHTML = `
      <div class="ProductList-list">
        <div class="product-item">
          <product-item>
            <a class="Product-item" href="https://www.rngwine.com/products/chateau-latour-1981-1">
              <div class="info-box">
                <div class="title text-primary-color">Chateau Latour 1981</div>
                <div class="quick-cart-price">
                  <div class="price__regular"><span class="sl-price">HK$4,500.00</span></div>
                </div>
              </div>
            </a>
          </product-item>
        </div>
        <div class="product-item">
          <product-item>
            <a class="Product-item" href="https://www.rngwine.com/products/chateau-gloria-2022-rp93">
              <div class="info-box">
                <div class="title text-primary-color">Chateau Gloria 2022 (RP93)</div>
              </div>
            </a>
          </product-item>
        </div>
      </div>
    `;

    const products = rngwineAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe("Chateau Latour 1981");
    expect(products[1]?.rawTitle).toBe("Chateau Gloria 2022");
  });

  it("extracts product detail page title from h1.Product-title", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/products/chateau-latour-1981-1" },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <h1 class="Product-title">Chateau Latour 1981</h1>
      <div class="product-item">
        <div class="title">Should not extract on PDP</div>
      </div>
    `;

    const products = rngwineAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("Chateau Latour 1981");
  });

  it("strips critic scores and bottle pack suffixes before Vivino search", () => {
    const query = rngwineAdapter.normalizeTitle(
      "SALE Moulin de Duhart 2023 (RP90) - 6 Bottle Pack",
    );
    expect(query.searchText).toBe("Moulin de Duhart");
    expect(query.vintage).toBe(2023);
  });

  it("strips sold-out prefix and leading bottle size", () => {
    const query = rngwineAdapter.normalizeTitle(
      "售完 1500ml Chateau Pichon Baron 2009 (RP98) (1500ml)",
    );
    expect(query.searchText).toBe("Chateau Pichon Baron");
    expect(query.vintage).toBe(2009);
  });
});
