import { afterEach, describe, expect, it } from "vitest";
import { cotedorAdapter } from "../../src/adapters/cotedor";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("cotedorAdapter", () => {
  it("matches Cote d'Or Fine Wines URLs", () => {
    expect(
      cotedorAdapter.matchesUrl(
        "https://cotedorfinewines.com/fine-wine/?adv_search=wc&val%5B0%5D=bordeaux",
      ),
    ).toBe(true);
    expect(
      cotedorAdapter.matchesUrl(
        "https://www.cotedorfinewines.com/product/2014-chateau-valandraud-6x75cl/",
      ),
    ).toBe(true);
    expect(cotedorAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
  });

  it("extracts Flatsome grid titles and keeps case size for identity", () => {
    document.body.innerHTML = `
      <div class="shop-container">
        <div class="products">
          <div class="product-small col has-hover product type-product">
            <div class="product-small box">
              <div class="box-text">
                <div class="hub-product-icons"><span class="hub-product-rating-score">94</span></div>
                <div class="title-wrapper">
                  <p class="name product-title woocommerce-loop-product__title">
                    <a class="woocommerce-LoopProduct-link">2014 Chateau Valandraud 6x75cl</a>
                  </p>
                </div>
                <div class="price-wrapper"><span class="price">HK$5,700</span></div>
              </div>
            </div>
          </div>
          <div class="product-small col product type-product">
            <div class="box-text">
              <p class="woocommerce-loop-product__title">
                <a>NV Charles Heidsieck, Blanc de Blancs 1x75cl</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="header-cart">
        <div class="product-small col type-product">
          <p class="woocommerce-loop-product__title"><a>Should not extract from cart</a></p>
        </div>
      </div>
    `;

    const products = cotedorAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe("2014 Chateau Valandraud 6x75cl");
    expect(products[0]?.element.tagName).toBe("P");
    expect(products[1]?.rawTitle).toBe("NV Charles Heidsieck, Blanc de Blancs 1x75cl");
  });

  it("extracts the product page title and skips related cards", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/product/2014-chateau-valandraud-6x75cl-10545100-6-ib/" },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <h1 class="product-title product_title entry-title">2014 Chateau Valandraud 6x75cl</h1>
      <div class="shop-container">
        <div class="product-small col type-product">
          <p class="woocommerce-loop-product__title"><a>Should not extract on PDP</a></p>
        </div>
      </div>
    `;

    const products = cotedorAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("2014 Chateau Valandraud 6x75cl");
    expect(products[0]?.element.tagName).toBe("H1");
  });

  it("drops case size before Vivino search and keeps vintage", () => {
    const query = cotedorAdapter.normalizeTitle("2014 Chateau Valandraud 6x75cl");
    expect(query.vintage).toBe(2014);
    expect(query.searchText).toContain("Chateau Valandraud");
    expect(query.searchText).not.toMatch(/75cl|6x/i);

    const nv = cotedorAdapter.normalizeTitle(
      "NV Charles Heidsieck, Blanc de Blancs 1x75cl",
    );
    expect(nv.vintage).toBeNull();
    expect(nv.nonVintage).toBe(true);
    expect(nv.searchText).not.toMatch(/75cl/i);
  });
});
