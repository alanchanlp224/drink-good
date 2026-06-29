import { afterEach, describe, expect, it } from "vitest";
import { tencellarsAdapter } from "../../src/adapters/tencellars";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("tencellarsAdapter", () => {
  it("matches Ten Cellars URLs", () => {
    expect(
      tencellarsAdapter.matchesUrl("https://www.tencellars.hk/red-wines.html"),
    ).toBe(true);
    expect(
      tencellarsAdapter.matchesUrl(
        "https://tencellars.hk/chianti-classico-2023-val-delle-corti.html",
      ),
    ).toBe(true);
    expect(tencellarsAdapter.matchesUrl("https://wineview.com.hk/")).toBe(
      false,
    );
  });

  it("extracts producer and wine name from listing cards", () => {
    document.body.innerHTML = `
      <div class="wine-showcase">
        <div class="wine-list list">
          <div class="info">
            <div class="wrapper-hitem">
              <h2>Val delle Corti</h2>
              <h1><a href="/chianti-classico-2023-val-delle-corti.html">Chianti Classico 2023</a></h1>
              <div class="wine-info">Red, 0.75L, Dry</div>
            </div>
            <div class="price">HK$250.00</div>
          </div>
          <div class="info">
            <div class="wrapper-hitem">
              <h2>Giuseppe Mascarello</h2>
              <h1><a href="/dolcetto-dalba-2023.html">Dolcetto d'Alba 2023</a></h1>
              <div class="wine-info">Red, 0.75L, Dry</div>
            </div>
            <div class="price">HK$320.00</div>
          </div>
        </div>
      </div>
    `;

    const products = tencellarsAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe("Val delle Corti Chianti Classico 2023");
    expect(products[0]?.element.tagName).toBe("A");
    expect(products[1]?.rawTitle).toBe("Giuseppe Mascarello Dolcetto d'Alba 2023");
  });

  it("extracts product detail page title from wine-page h1", () => {
    document.body.innerHTML = `
      <div class="entry-img page wine-page">
        <div class="content">
          <h1>Chianti Classico 2023 Val delle Corti</h1>
        </div>
      </div>
      <div class="wine-specifics">
        <h2>Chianti Classico 2023 Val delle Corti</h2>
        <div class="price">HK$250.00</div>
      </div>
      <div class="wine-showcase">
        <div class="info">
          <div class="wrapper-hitem">
            <h2>Should not extract on PDP</h2>
            <h1><a href="#">Other wine</a></h1>
          </div>
        </div>
      </div>
    `;

    const products = tencellarsAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe(
      "Chianti Classico 2023 Val delle Corti",
    );
    expect(products[0]?.element.tagName).toBe("H1");
  });

  it("normalizes vintage for Vivino search", () => {
    const query = tencellarsAdapter.normalizeTitle(
      "Val delle Corti Chianti Classico 2023",
    );
    expect(query.searchText).toBe("Val delle Corti Chianti Classico");
    expect(query.vintage).toBe(2023);
  });
});
