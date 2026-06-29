import { describe, expect, it } from "vitest";
import { cruAdapter } from "../../src/adapters/cru";

describe("cruAdapter", () => {
  it("matches Cru Markets URLs", () => {
    expect(cruAdapter.matchesUrl("https://markets.cruworldwine.com/hk")).toBe(
      true,
    );
    expect(
      cruAdapter.matchesUrl(
        "https://markets.cruworldwine.com/hk/cat/burgundy-2024-en-primeur",
      ),
    ).toBe(true);
    expect(cruAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
    expect(cruAdapter.matchesUrl("https://hk.cruworldwine.com/hk")).toBe(
      false,
    );
  });

  it("extracts dashboard product cards with vintage", () => {
    document.body.innerHTML = `
      <div class="product-outer dashboard-product">
        <div class="flex column lh-16">
          <div class="name">Château Lynch-Bages</div>
          <div class="vintage-wrapper flex">(6x75cl) 2019</div>
          <div class="price-section"><span class="price-value">HK$ 4,200</span></div>
        </div>
      </div>
      <div class="product-outer dashboard-product">
        <div class="flex column lh-16">
          <div class="name">Domaine de la Romanée-Conti La Tâche</div>
          <div class="vintage-wrapper flex">2018</div>
        </div>
      </div>
    `;

    const products = cruAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe("Château Lynch-Bages (6x75cl) 2019");
    expect(products[0]?.element.className).toBe("name");
    expect(products[1]?.rawTitle).toContain("Romanée-Conti");
    expect(products[1]?.rawTitle).toContain("2018");
  });

  it("extracts desktop mat-table rows with linked wine names", () => {
    document.body.innerHTML = `
      <mat-table>
        <mat-row class="mat-row">
          <mat-cell class="mat-column-wine-name">
            <div class="table-image-container"><img src="/img.png" alt=""></div>
            <div class="wine-name">
              <a href="/hk/product/lynch-bages">Château Lynch-Bages</a>
            </div>
          </mat-cell>
          <mat-cell class="mat-column-vintage">2019</mat-cell>
          <mat-cell class="mat-column-pack_size">6x75cl</mat-cell>
        </mat-row>
      </mat-table>
    `;

    const products = cruAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("Château Lynch-Bages 2019 6x75cl");
    expect(products[0]?.element.tagName).toBe("A");
  });

  it("extracts table row wine names with truncated span", () => {
    document.body.innerHTML = `
      <table>
        <tr class="mat-row">
          <td class="mat-column-wine-name wine-cell">
            <div class="wine-name">
              <span class="truncated-wine-name">Petrus Pomerol</span>
            </div>
          </td>
        </tr>
      </table>
    `;

    const products = cruAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("Petrus Pomerol");
  });

  it("prefers listing rows over detail modal titles", () => {
    document.body.innerHTML = `
      <div class="product-outer dashboard-product">
        <div class="name">Château Lynch-Bages 2019</div>
      </div>
      <div class="cdk-overlay-pane">
        <div class="product-name">Hidden modal wine</div>
      </div>
    `;

    const products = cruAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("Château Lynch-Bages 2019");
  });

  it("extracts product detail modal title when no listings are present", () => {
    document.body.innerHTML = `
      <app-asset-listing-details>
        <h2 class="modal-title">Château Margaux 2015</h2>
      </app-asset-listing-details>
    `;

    const products = cruAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("Château Margaux 2015");
  });

  it("strips pack size and extracts vintage for Vivino search", () => {
    const query = cruAdapter.normalizeTitle(
      "Château Lynch-Bages (6x75cl) 2019",
    );
    expect(query.searchText).not.toMatch(/6x75cl/i);
    expect(query.vintage).toBe(2019);
  });
});
