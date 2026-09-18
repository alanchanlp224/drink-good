import { afterEach, describe, expect, it } from "vitest";
import { ginsbergchanAdapter } from "../../src/adapters/ginsbergchan";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("ginsbergchanAdapter", () => {
  it("matches Ginsberg+Chan URLs", () => {
    expect(
      ginsbergchanAdapter.matchesUrl("https://ginsbergchan.com/collections/red"),
    ).toBe(true);
    expect(
      ginsbergchanAdapter.matchesUrl(
        "https://www.ginsbergchan.com/collections/red/products/00-wines-richard-hermann-cuvee-pinot-noir-2022",
      ),
    ).toBe(true);
    expect(ginsbergchanAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
  });

  it("extracts Boost grid titles and ignores search-template duplicates", () => {
    document.body.innerHTML = `
      <div class="boost-pfs-filter-right-col">
        <div class="boost-pfs-filter-products">
          <div class="boost-pfs-filter-product-item">
            <div class="boost-pfs-filter-product-bottom-inner">
              <a class="boost-pfs-filter-product-item-title" href="/products/example#">00 Wines 'Richard Hermann Cuvee' Pinot Noir 2021</a>
              <p class="boost-pfs-filter-product-item-vendor">Red<span class="rating-tag">JD 100</span></p>
              <p class="boost-pfs-filter-product-item-price">HKD $1,950</p>
            </div>
          </div>
          <div class="boost-pfs-filter-product-item">
            <a class="boost-pfs-filter-product-item-title">00 Wines 'Shea' Pinot Noir Magnum 2023</a>
          </div>
        </div>
      </div>
      <div class="boost-pfs-search">
        <a class="boost-pfs-filter-product-item-title">Should not extract from search</a>
      </div>
    `;

    const products = ginsbergchanAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe(
      "00 Wines 'Richard Hermann Cuvee' Pinot Noir 2021",
    );
    expect(products[0]?.element.tagName).toBe("A");
    expect(products[1]?.rawTitle).toBe("00 Wines 'Shea' Pinot Noir Magnum 2023");
  });

  it("extracts product detail title and skips related-product cards", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname:
          "/collections/red/products/00-wines-richard-hermann-cuvee-pinot-noir-2022",
      },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <div class="product-single__meta">
        <div class="product-block product-block--header">
          <h1 class="h2 product-single__title">00 Wines 'Richard Hermann Cuvee' Pinot Noir 2021</h1>
        </div>
        <div class="product-block product-block--price">HKD $1,950.00</div>
      </div>
      <div class="boost-pfs-filter-products">
        <div class="boost-pfs-filter-product-item">
          <a class="boost-pfs-filter-product-item-title">Should not extract on PDP</a>
        </div>
      </div>
    `;

    const products = ginsbergchanAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe(
      "00 Wines 'Richard Hermann Cuvee' Pinot Noir 2021",
    );
    expect(products[0]?.element.tagName).toBe("H1");
  });

  it("keeps the visible vintage and drops magnum before Vivino search", () => {
    const query = ginsbergchanAdapter.normalizeTitle(
      "00 Wines 'Shea' Pinot Noir Magnum 2023",
    );
    expect(query.vintage).toBe(2023);
    expect(query.searchText).not.toMatch(/magnum/i);
    expect(query.searchText).toContain("Shea");
  });
});
