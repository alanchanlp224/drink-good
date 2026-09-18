import { afterEach, describe, expect, it } from "vitest";
import { winecoupleAdapter } from "../../src/adapters/winecouple";

const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("winecoupleAdapter", () => {
  it("matches Wine Couple URLs", () => {
    expect(
      winecoupleAdapter.matchesUrl(
        "https://www.winecouple.hk/categories/frenchwines-terroircollection",
      ),
    ).toBe(true);
    expect(
      winecoupleAdapter.matchesUrl(
        "https://winecouple.hk/products/chateau-du-closet-bordeaux-rouge-2020",
      ),
    ).toBe(true);
    expect(winecoupleAdapter.matchesUrl("https://wineview.com.hk/")).toBe(false);
  });

  it("strips SKU brackets and Chinese notes from listing titles", () => {
    document.body.innerHTML = `
      <div class="ProductList-list">
        <div class="product-item">
          <product-item>
            <div class="info-box">
              <div class="title text-primary-color">Chateau du Closet Bordeaux Rouge 2020《ZF521A》</div>
              <div class="quick-cart-price">
                <div class="price-sale">HK$468.00</div>
              </div>
            </div>
          </product-item>
        </div>
        <div class="product-item">
          <product-item>
            <div class="info-box">
              <div class="title">Chateau du Closet Bordeaux Rouge 2020 紅酒《ZF521A》</div>
            </div>
          </product-item>
        </div>
        <div class="product-item">
          <product-item>
            <div class="info-box">
              <div class="title">Krug Rose 29eme Edition Brut Champagne 庫克第 29 版粉紅香檳《ZTF383》</div>
            </div>
          </product-item>
        </div>
      </div>
    `;

    const products = winecoupleAdapter.extractProducts();
    expect(products).toHaveLength(2);
    expect(products[0]?.rawTitle).toBe("Chateau du Closet Bordeaux Rouge 2020");
    expect(products[0]?.element.classList.contains("title")).toBe(true);
    expect(products[1]?.rawTitle).toBe(
      "Krug Rose 29eme Edition Brut Champagne",
    );
  });

  it("extracts product detail page title from h1.Product-title", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/products/chateau-du-closet-bordeaux-rouge-2020" },
      writable: true,
      configurable: true,
    });

    document.body.innerHTML = `
      <div class="box-default">
        <h1 class="Product-title">Chateau Marojallia 2018 瑪若嘉酒莊 Margaux 瑪歌 《ZTF609A》</h1>
      </div>
      <div class="ProductList-list">
        <div class="product-item">
          <div class="title">Should not extract on PDP</div>
        </div>
      </div>
    `;

    const products = winecoupleAdapter.extractProducts();
    expect(products).toHaveLength(1);
    expect(products[0]?.rawTitle).toBe("Chateau Marojallia 2018 Margaux");
    expect(products[0]?.element.tagName).toBe("H1");
  });

  it("normalizes vintage and drops gift-set tails before Vivino search", () => {
    const closet = winecoupleAdapter.normalizeTitle(
      "Chateau du Closet Bordeaux Rouge 2020《ZF521A》",
    );
    expect(closet.searchText).toContain("Chateau du Closet");
    expect(closet.vintage).toBe(2020);

    const gift = winecoupleAdapter.normalizeTitle(
      "Nicolas Feuillatte Reserve Exclusive Rose NV with Gift Box (粉/黑色盒)《ZTF594_BOX》",
    );
    expect(gift.searchText).not.toMatch(/gift|zf/i);
    expect(gift.nonVintage).toBe(true);

    const set = winecoupleAdapter.normalizeTitle(
      "Lanson Noble Cuvee Brut 2002 Gift Set + Two Champagne Glasses《ZTF400_BOX》",
    );
    expect(set.searchText).not.toMatch(/gift|glasses/i);
    expect(set.vintage).toBe(2002);
  });
});
