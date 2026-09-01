import { afterEach, describe, expect, it } from "vitest";
import { lyndhurstAdapter } from "../../src/adapters/lyndhurst";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("lyndhurstAdapter", () => {
  it("matches Lyndhurst Wine URLs", () => {
    expect(
      lyndhurstAdapter.matchesUrl(
        "https://lyndhurstwine.com/collections/red-wines",
      ),
    ).toBe(true);
    expect(
      lyndhurstAdapter.matchesUrl(
        "https://www.lyndhurstwine.com/collections/red-wines/products/j-lohr-estates-seven-oaks-cabernet-sauvignon-paso-robles-california-2022",
      ),
    ).toBe(true);
    expect(lyndhurstAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
  });

  it("extracts title from product-card grid listings", () => {
    document.body.innerHTML = `
      <product-card
        data-product-id="7343393931344"
        class="product-card js-product-card"
      >
        <div class="product-card-top">
          <a
            class="product-card__link product-card__link--full-opacity"
            aria-label="J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022"
          >
            <img
              class="product-card__img"
              alt="J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022"
            />
          </a>
        </div>
        <div class="product-card__details">
          <a
            class="product-card__link"
            title="J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022"
          >
            <h3 class="product-card__title">
              <product-card-title>J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022</product-card-title>
            </h3>
          </a>
          <div class="price">
            <span class="price__number"><span class="money">HK$270</span></span>
          </div>
        </div>
      </product-card>
      <product-card data-product-id="999" class="product-card js-product-card">
        <div class="product-card__details">
          <a class="product-card__link" title="2020 Chateau Example">
            <h3 class="product-card__title">
              <product-card-title>2020 Chateau Example</product-card-title>
            </h3>
          </a>
        </div>
      </product-card>
    `;

    const products = lyndhurstAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe(
      "J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022",
    );
    expect(products[0]?.element.tagName).toBe("H3");
    expect(products[1]?.rawTitle).toBe("2020 Chateau Example");
  });

  it("extracts product detail page title from JSON-LD and h1", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname:
          "/collections/red-wines/products/j-lohr-estates-seven-oaks-cabernet-sauvignon-paso-robles-california-2022",
      },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022"}
      </script>
      <product-single data-product-id="7343393931344" class="product-single js-product-single">
        <div class="product-single__box">
          <div class="product-single__box__block product-single__box__block--title">
            <h1 class="product-single__title">J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022</h1>
          </div>
          <div class="product-single__box__block product-single__box__block--price">
            <div class="price"><span class="money">HK$270</span></div>
          </div>
        </div>
      </product-single>
      <product-card data-product-id="999" class="product-card js-product-card">
        <div class="product-card__details">
          <h3 class="product-card__title"><product-card-title>Should not extract on PDP</product-card-title></h3>
        </div>
      </product-card>
    `;

    const products = lyndhurstAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe(
      "J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022",
    );
    expect(products[0]?.element.tagName).toBe("H1");
  });

  it("normalizes vintage for Vivino search", () => {
    const query = lyndhurstAdapter.normalizeTitle(
      "J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles 2022",
    );
    expect(query.searchText).toBe(
      "J. Lohr Estates Seven Oaks Cabernet Sauvignon Pasa Robles",
    );
    expect(query.vintage).toBe(2022);
  });
});
