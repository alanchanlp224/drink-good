import { describe, expect, it, beforeEach } from "vitest";
import { wineviewBadgeAdapter } from "../../src/adapters/wineview-badge";
import { xtrawineBadgeAdapter } from "../../src/adapters/xtrawine-badge";
import {
  buildBadgeMarkup,
  hasBadge,
  injectBadgeStyles,
  removeAllPageBadges,
  renderBadge,
} from "../../src/content/badge";
import { insertBadgeAfterTitleBeforePrice } from "../../src/core/badge-display";
import type { VivinoMatchResult } from "../../src/vivino/types";

const MATCHED_RESULT: VivinoMatchResult = {
  status: "matched",
  confidence: 0.9,
  candidate: {
    wineId: 1,
    vintageId: 2,
    matchedName: "Château Lynch-Bages 2019",
    vintage: 2019,
    stats: { ratingsAverage: 4.7, ratingsCount: 105 },
    vivinoUrl: "https://www.vivino.com/wines/1",
    winery: "Château Lynch-Bages",
    source: "algolia",
  },
};

function wineviewCardHtml(): string {
  return `
    <ul class="products">
      <li class="product">
        <a class="woocommerce-LoopProduct-link" href="/product/chateau-lynch-bages-2019/">
          <img alt="wine" />
          <h2 class="woocommerce-loop-product__title">Chateau Lynch Bages<br>2019</h2>
          <span class="price">$790.00</span>
        </a>
        <a class="button">Add to basket</a>
      </li>
    </ul>
  `;
}

describe("badge", () => {
  beforeEach(() => {
    document.body.innerHTML = wineviewCardHtml();
    injectBadgeStyles();
  });

  it("renders matched badge without throwing (closed shadow root)", () => {
    const title = document.querySelector<HTMLElement>(
      ".woocommerce-loop-product__title",
    );
    expect(title).not.toBeNull();

    expect(() =>
      renderBadge(title!, MATCHED_RESULT, wineviewBadgeAdapter),
    ).not.toThrow();
    expect(hasBadge(title!, wineviewBadgeAdapter)).toBe(true);
  });

  it("wineview places badge after title and before price", () => {
    const title = document.querySelector<HTMLElement>(
      ".woocommerce-loop-product__title",
    )!;
    const price = document.querySelector<HTMLElement>(".price")!;

    renderBadge(title, MATCHED_RESULT, wineviewBadgeAdapter);

    const badge = document.querySelector("[data-drink-good-badge]");
    expect(badge).not.toBeNull();
    expect(badge?.previousElementSibling).toBe(title);
    expect(badge?.nextElementSibling).toBe(price);
  });

  it("insertBadgeAfterTitleBeforePrice helper inserts before price", () => {
    const title = document.querySelector<HTMLElement>(
      ".woocommerce-loop-product__title",
    )!;
    const price = document.querySelector<HTMLElement>(".price")!;
    const host = document.createElement("div");
    host.setAttribute("data-drink-good-badge", "true");

    insertBadgeAfterTitleBeforePrice({
      anchorElement: title,
      badgeHost: host,
      productCard: title.closest("li.product"),
    });

    expect(host.previousElementSibling).toBe(title);
    expect(host.nextElementSibling).toBe(price);
  });

  it("badge markup includes score and full vivino name", () => {
    const markup = buildBadgeMarkup(
      "4.7",
      105,
      "Château Lynch-Bages Pauillac (Grand Cru Classé)",
    );
    expect(markup).toContain("★");
    expect(markup).toContain("4.7");
    expect(markup).toContain("(105)");
    expect(markup).toContain("Château Lynch-Bages Pauillac (Grand Cru Classé)");
  });

  it("badge markup shows All Vintage label for wine-wide fallback scores", () => {
    const markup = buildBadgeMarkup(
      "4.2",
      8944,
      "La Chapelle de La Mission Haut-Brion Pessac-Léognan 2023",
      "all_vintages",
    );
    expect(markup).toContain("4.2 (All Vintage)");
    expect(markup).not.toContain("(8,944)");
    expect(markup).not.toContain("(8944)");
  });

  it("renders unknown match badge", () => {
    const title = document.querySelector<HTMLElement>(
      ".woocommerce-loop-product__title",
    )!;

    renderBadge(
      title,
      {
        status: "no_match",
        reason: "No confident match",
        bestConfidence: 0.2,
      },
      wineviewBadgeAdapter,
    );

    expect(hasBadge(title, wineviewBadgeAdapter)).toBe(true);
  });

  it("removeAllPageBadges clears every badge on the page", () => {
    const title = document.querySelector<HTMLElement>(
      ".woocommerce-loop-product__title",
    )!;
    renderBadge(title, MATCHED_RESULT, wineviewBadgeAdapter);
    expect(document.querySelectorAll("[data-drink-good-badge]")).toHaveLength(1);

    removeAllPageBadges();
    expect(document.querySelectorAll("[data-drink-good-badge]")).toHaveLength(0);
    expect(hasBadge(title, wineviewBadgeAdapter)).toBe(false);
  });

  it("replaces existing badge on re-render", () => {
    const title = document.querySelector<HTMLElement>(
      ".woocommerce-loop-product__title",
    )!;
    const card = title.closest("li.product")!;

    renderBadge(title, MATCHED_RESULT, wineviewBadgeAdapter);
    renderBadge(title, MATCHED_RESULT, wineviewBadgeAdapter);

    expect(card.querySelectorAll("[data-drink-good-badge]")).toHaveLength(1);
  });

  it("click guard intercepts overlay navigation on XtraWine-style cards", () => {
    document.body.innerHTML = `
      <li class="grid__item csr" data-product-id="1">
        <div class="card card--standard">
          <a class="position-absolute top-0 w-100 h-100 d-block" href="/products/example"></a>
          <div class="position-static card__content with-quick-add">
            <div class="card__information">
              <div class="grid-product-title h3">
                <a class="full-unstyled-link" href="/products/example">Barbaresco 2022</a>
              </div>
              <div class="card-information">
                <div class="price grid-product-price">€27.00</div>
              </div>
            </div>
          </div>
        </div>
      </li>
    `;

    const title = document.querySelector<HTMLElement>(".full-unstyled-link")!;
    renderBadge(title, MATCHED_RESULT, xtrawineBadgeAdapter);

    const badge = document.querySelector<HTMLElement>("[data-drink-good-badge]")!;
    const overlay = document.querySelector<HTMLElement>(
      "a.position-absolute.top-0",
    )!;
    const content = document.querySelector<HTMLElement>(
      ".card__content.with-quick-add",
    )!;

    expect(content.style.getPropertyValue("position")).toBe("relative");
    expect(content.style.getPropertyPriority("position")).toBe("important");

    badge.getBoundingClientRect = () =>
      ({
        x: 10,
        y: 10,
        left: 10,
        top: 10,
        right: 110,
        bottom: 40,
        width: 100,
        height: 30,
        toJSON: () => ({}),
      }) as DOMRect;

    let overlayClicked = false;
    overlay.addEventListener("click", () => {
      overlayClicked = true;
    });

    document.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: 50,
        clientY: 20,
      }),
    );

    expect(overlayClicked).toBe(false);
    expect(badge.dataset.drinkGoodClickGuard).toBe("armed");
  });
});
