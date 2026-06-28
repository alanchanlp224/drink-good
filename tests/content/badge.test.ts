import { describe, expect, it, beforeEach } from "vitest";
import { wineviewBadgeAdapter } from "../../src/adapters/wineview-badge";
import {
  buildBadgeMarkup,
  hasBadge,
  injectBadgeStyles,
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

  it("replaces existing badge on re-render", () => {
    const title = document.querySelector<HTMLElement>(
      ".woocommerce-loop-product__title",
    )!;
    const card = title.closest("li.product")!;

    renderBadge(title, MATCHED_RESULT, wineviewBadgeAdapter);
    renderBadge(title, MATCHED_RESULT, wineviewBadgeAdapter);

    expect(card.querySelectorAll("[data-drink-good-badge]")).toHaveLength(1);
  });
});
