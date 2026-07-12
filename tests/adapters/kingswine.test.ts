import { afterEach, describe, expect, it } from "vitest";
import { kingswineAdapter } from "../../src/adapters/kingswine";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("kingswineAdapter", () => {
  it("matches King's Wine Cellar URLs", () => {
    expect(
      kingswineAdapter.matchesUrl("https://kingswine.hk/collections/bordeaux"),
    ).toBe(true);
    expect(
      kingswineAdapter.matchesUrl(
        "https://www.kingswine.hk/collections/bordeaux/products/penfolds-bin-707-2016-611207102016bt00on",
      ),
    ).toBe(true);
    expect(kingswineAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
  });

  it("extracts title from grid product cards", () => {
    document.body.innerHTML = `
      <div class="grid-product" data-product-id="4264988868662">
        <div class="grid-item__content">
          <a class="grid-item__link" href="/collections/bordeaux/products/example">
            <img class="grid-product__image" alt="" />
          </a>
          <div class="grid-item__meta">
            <div class="grid-item__meta-main">
              <div class="grid-product__title">
                <a class="grid-item__link" href="/collections/bordeaux/products/example">2016 Penfolds Bin 707</a>
              </div>
            </div>
            <div class="grid-item__meta-secondary">
              <div class="grid-product__price">$3,680.00</div>
            </div>
          </div>
        </div>
      </div>
      <div class="grid-product" data-product-id="999">
        <div class="grid-item__content">
          <a class="grid-item__link" href="/collections/bordeaux/products/other">
            <div class="grid-product__title">2022 Domaine Example</div>
          </a>
        </div>
      </div>
    `;

    const products = kingswineAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("2016 Penfolds Bin 707");
    expect(products[0]?.element.classList.contains("grid-item__link")).toBe(true);
  });

  it("extracts product detail page title from JSON-LD and h1", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname:
          "/collections/bordeaux/products/penfolds-bin-707-2016-611207102016bt00on",
      },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"2016 Penfolds Bin 707"}
      </script>
      <div class="product-single__meta">
        <h1 class="h2 product-single__title">2016 Penfolds Bin 707</h1>
        <div class="product-block product-block--price">$3,680.00</div>
      </div>
      <div class="grid-product" data-product-id="999">
        <div class="grid-product__title"><a class="grid-item__link">Should not extract on PDP</a></div>
      </div>
    `;

    const products = kingswineAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("2016 Penfolds Bin 707");
    expect(products[0]?.element.tagName).toBe("H1");
  });

  it("normalizes vintage for Vivino search", () => {
    const query = kingswineAdapter.normalizeTitle("2016 Penfolds Bin 707");
    expect(query.searchText).toBe("Penfolds Bin 707");
    expect(query.vintage).toBe(2016);
  });

  it("stacks floating trigger above Smile rewards launcher", () => {
    expect(kingswineAdapter.floatingTrigger?.stackAboveSelector).toBe(
      ".smile-launcher-frame-container",
    );
    expect(kingswineAdapter.floatingTrigger?.stackGapPx).toBe(24);
  });
});
