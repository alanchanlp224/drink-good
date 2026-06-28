import { describe, expect, it } from "vitest";
import {
  findWooProductCard,
  insertBadgeAfterTitleBeforePrice,
} from "../../src/core/badge-display";

describe("badge-display", () => {
  it("findWooProductCard resolves li.product", () => {
    document.body.innerHTML = `
      <ul class="products">
        <li class="product"><h2 class="title">Wine</h2></li>
      </ul>
    `;
    const title = document.querySelector(".title")!;
    expect(findWooProductCard(title)?.tagName).toBe("LI");
  });

  it("insertBadgeAfterTitleBeforePrice falls back to after title", () => {
    document.body.innerHTML = `<div><h2 class="title">Wine</h2><p>Notes</p></div>`;
    const title = document.querySelector(".title")!;
    const host = document.createElement("div");
    insertBadgeAfterTitleBeforePrice({
      anchorElement: title,
      badgeHost: host,
      productCard: null,
    });
    expect(host.previousElementSibling).toBe(title);
  });
});
