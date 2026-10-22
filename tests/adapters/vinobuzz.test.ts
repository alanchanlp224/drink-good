import { afterEach, describe, expect, it } from "vitest";
import { vinobuzzAdapter } from "../../src/adapters/vinobuzz";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("vinobuzzAdapter", () => {
  it("matches VinoBuzz URLs", () => {
    expect(vinobuzzAdapter.matchesUrl("https://vinobuzz.ai/marketplace")).toBe(true);
    expect(
      vinobuzzAdapter.matchesUrl(
        "https://www.vinobuzz.ai/product/domaine_example_v2022_f750ml",
      ),
    ).toBe(true);
    expect(vinobuzzAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
  });

  it("extracts marketplace card titles and skips cards outside the results grid", () => {
    document.body.innerHTML = `
      <div class="search-results-area">
        <div class="wine-masonry-grid">
          <a class="wine-card wine-card--similar-products wine-card--nora2-layout">
            <h3 class="wine-name wine-name--nora2">Clos Mogador 'Com Tu' 2021</h3>
            <div class="price-section"><span class="price">HK$ 456</span></div>
          </a>
          <a class="wine-card wine-card--nora2-layout">
            <h3 class="wine-name wine-name--nora2">Champagne Laurent Lequart 'Prestige' NV</h3>
          </a>
        </div>
      </div>
      <div class="cart-drawer">
        <a class="wine-card">
          <h3 class="wine-name">Should not extract from cart</h3>
        </a>
      </div>
    `;

    const products = vinobuzzAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe("Clos Mogador 'Com Tu' 2021");
    expect(products[0]?.element.tagName).toBe("H3");
    expect(products[1]?.rawTitle).toBe("Champagne Laurent Lequart 'Prestige' NV");
  });

  it("extracts the product page title and skips similar cards", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname:
          "/product/domaine_de_la_commaraine_nuits_saint_georges_aux_bousselots_premier_cru_v2022_f750ml",
      },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <h1 class="wine-title">Domaine de la Commaraine Nuits Saint Georges 'Aux Bousselots' Premier Cru 2022</h1>
      <div class="search-results-area">
        <a class="wine-card">
          <h3 class="wine-name wine-name--nora2">Should not extract on PDP</h3>
        </a>
      </div>
    `;

    const products = vinobuzzAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe(
      "Domaine de la Commaraine Nuits Saint Georges 'Aux Bousselots' Premier Cru 2022",
    );
    expect(products[0]?.element.tagName).toBe("H1");
  });

  it("keeps vintage and non-vintage markers for Vivino search", () => {
    const query = vinobuzzAdapter.normalizeTitle("Clos Mogador 'Com Tu' 2021");
    expect(query.vintage).toBe(2021);
    expect(query.searchText).toContain("Clos Mogador");

    const nv = vinobuzzAdapter.normalizeTitle("Champagne Laurent Lequart 'Prestige' NV");
    expect(nv.vintage).toBeNull();
    expect(nv.nonVintage).toBe(true);
  });
});
