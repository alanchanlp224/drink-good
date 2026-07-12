import { afterEach, describe, expect, it } from "vitest";
import { xtrawineAdapter } from "../../src/adapters/xtrawine";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("xtrawineAdapter", () => {
  it("matches XtraWine URLs", () => {
    expect(
      xtrawineAdapter.matchesUrl(
        "https://www.xtrawine.com/collections/red-wines",
      ),
    ).toBe(true);
    expect(
      xtrawineAdapter.matchesUrl(
        "https://xtrawine.com/products/produttori-del-barbaresco-barbaresco-2022",
      ),
    ).toBe(true);
    expect(xtrawineAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
  });

  it("extracts vendor and vintage line from Algolia collection cards", () => {
    document.body.innerHTML = `
      <ul class="algolia-product-grid">
        <li class="grid__item csr" data-product-id="8583541096619">
          <div class="card-wrapper product-card-wrapper">
            <div class="card__content">
              <div class="card__information">
                <div class="d-flex flex-column gap-1 flex-grow-1">
                  <div class="grid-product-vendor h4">Produttori del Barbaresco</div>
                  <div class="grid-product-title h3">
                    <a class="full-unstyled-link" title="2022" href="/products/produttori-del-barbaresco-barbaresco-2022">2022</a>
                  </div>
                </div>
                <div class="card-information">
                  <div class="price grid-product-price">€27.00</div>
                </div>
              </div>
            </div>
            <div class="card__media">
              <img alt="Produttori del Barbaresco Barbaresco 2022" />
            </div>
          </div>
        </li>
        <li class="grid__item csr" data-product-id="8506414694571">
          <div class="card-wrapper">
            <div class="card__content">
              <div class="card__information">
                <div class="d-flex flex-column gap-1 flex-grow-1">
                  <div class="grid-product-vendor h4">Mottura</div>
                  <div class="grid-product-title h3">
                    <a class="full-unstyled-link" title="Primitivo di Manduria Stilio 2023" href="/products/mottura-primitivo-di-manduria-stilio-2023">Primitivo di Manduria Stilio 2023</a>
                  </div>
                </div>
                <div class="card-information">
                  <div class="price grid-product-price">€18.00</div>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    `;

    const products = xtrawineAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe(
      "Produttori del Barbaresco Barbaresco 2022",
    );
    expect(products[0]?.element.classList.contains("full-unstyled-link")).toBe(
      true,
    );
    expect(products[1]?.rawTitle).toBe(
      "Mottura Primitivo di Manduria Stilio 2023",
    );
  });

  it("extracts product detail page title from JSON-LD and h1", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/products/produttori-del-barbaresco-barbaresco-2022",
      },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"Produttori del Barbaresco Barbaresco 2022"}
      </script>
      <product-info class="product__info-container">
        <h2 class="product__text inline-richtext h3">
          <a href="/collections/produttori-del-barbaresco">Produttori del Barbaresco</a>
        </h2>
        <div class="product__title">
          <h1 class="pdpprodname text-primary">Barbaresco 2022</h1>
        </div>
        <div class="pdp-price-block"><div class="price">€27.00</div></div>
      </product-info>
      <ul class="algolia-product-grid">
        <li class="grid__item" data-product-id="999">
          <div class="grid-product-title"><a class="full-unstyled-link">Should not extract on PDP</a></div>
        </li>
      </ul>
    `;

    const products = xtrawineAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe(
      "Produttori del Barbaresco Barbaresco 2022",
    );
    expect(products[0]?.element.tagName).toBe("H1");
  });

  it("normalizes vintage for Vivino search", () => {
    const query = xtrawineAdapter.normalizeTitle(
      "Produttori del Barbaresco Barbaresco 2022",
    );
    expect(query.searchText).toBe("Produttori del Barbaresco Barbaresco");
    expect(query.vintage).toBe(2022);
  });
});
