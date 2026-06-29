import { afterEach, describe, expect, it } from "vitest";
import { watsonswineAdapter } from "../../src/adapters/watsonswine";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("watsonswineAdapter", () => {
  it("matches Watson's Wine URLs", () => {
    expect(
      watsonswineAdapter.matchesUrl(
        "https://www.watsonswine.com/en/c/10010231",
      ),
    ).toBe(true);
    expect(
      watsonswineAdapter.matchesUrl(
        "https://watsonswine.com/en/wine/foo/p/BP_12345",
      ),
    ).toBe(true);
    expect(watsonswineAdapter.matchesUrl("https://wineview.com.hk/")).toBe(
      false,
    );
  });

  it("extracts ww-product-tile listing products from span.name", () => {
    document.body.innerHTML = `
      <ww-product-list>
        <ww-product-tile>
          <div class="product-container">
            <div class="product-info">
              <a class="product-name" href="/en/wine/foo/p/BP_1">
                <span class="brand">JEROME GALEYRAND</span>
                <span class="name">Jerome Galeyrand Meursault Villages 2023 (Limited time offer item – other promotion offers and W Rewards are not applicable)</span>
              </a>
              <ww-product-price>
                <div class="price-container new-price"><span>$915</span></div>
              </ww-product-price>
            </div>
          </div>
        </ww-product-tile>
        <ww-product-tile>
          <div class="product-container">
            <div class="product-info">
              <a class="product-name" href="/en/wine/bar/p/BP_2">
                <span class="brand">MOULIN AUX MOINES</span>
                <span class="name">Clos Du Moulin Aux Moines Pommard 1er Cru 2019</span>
              </a>
            </div>
          </div>
        </ww-product-tile>
      </ww-product-list>
    `;

    const products = watsonswineAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe(
      "Jerome Galeyrand Meursault Villages 2023",
    );
    expect(products[0]?.element.className).toBe("product-name");
    expect(products[1]?.rawTitle).toBe(
      "Clos Du Moulin Aux Moines Pommard 1er Cru 2019",
    );
  });

  it("falls back to ww-product-list name links when tiles are absent", () => {
    document.body.innerHTML = `
      <ww-product-list>
        <a class="product-name" href="/en/wine/baz/p/BP_3">
          <span class="name">Petrus Pomerol 2015</span>
        </a>
      </ww-product-list>
    `;

    const products = watsonswineAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("Petrus Pomerol 2015");
  });

  it("extracts product detail page title from h1.product-name", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname:
          "/en/wine/chateau-margaux-2015/p/BP_999",
      },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <h1 class="product-name">Château Margaux 2015</h1>
      <ww-product-tile>
        <a class="product-name"><span class="name">Should not extract on PDP</span></a>
      </ww-product-tile>
    `;

    const products = watsonswineAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("Château Margaux 2015");
  });

  it("extracts vintage for Vivino search", () => {
    const query = watsonswineAdapter.normalizeTitle(
      "Jerome Galeyrand Meursault Villages 2023",
    );
    expect(query.vintage).toBe(2023);
  });

  it("strips parenthetical shop noise before Vivino search", () => {
    const query = watsonswineAdapter.normalizeTitle(
      "Château Lynch-Bages 2019 (Limited time offer – W Rewards not applicable)",
    );
    expect(query.searchText).toBe("Château Lynch-Bages");
    expect(query.vintage).toBe(2019);
  });

  it("strips giftbox suffix before Vivino search", () => {
    const query = watsonswineAdapter.normalizeTitle(
      "Pol Roger Brut Reserve NV (with Giftbox)",
    );
    expect(query.searchText).toBe("Pol Roger Brut Reserve");
    expect(query.vintage).toBeNull();
  });

  it("strips flute gift set suffix before Vivino search", () => {
    const query = watsonswineAdapter.normalizeTitle(
      "Bollinger Special Cuvee Brut Nv Set With 2 Flutes (with Gift Box)",
    );
    expect(query.searchText).toBe("Bollinger Special Cuvee Brut");
    expect(query.rawNormalized).toBe("Bollinger Special Cuvee Brut Nv");
  });

  it("strips spaced dash suffixes but keeps hyphenated wine names", () => {
    const query = watsonswineAdapter.normalizeTitle(
      "Château Lynch-Bages 2019 - Limited time offer",
    );
    expect(query.searchText).toBe("Château Lynch-Bages");
    expect(query.vintage).toBe(2019);

    const hyphenated = watsonswineAdapter.normalizeTitle("Jean-Marc Brocard Chablis 2022");
    expect(hyphenated.searchText).toBe("Jean-Marc Brocard Chablis");
    expect(hyphenated.vintage).toBe(2022);
  });
});
