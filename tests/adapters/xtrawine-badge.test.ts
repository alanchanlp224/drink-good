import { describe, expect, it } from "vitest";
import { xtrawineBadgeAdapter } from "../../src/adapters/xtrawine-badge";

const BADGE_ATTR = "data-drink-good-badge";

describe("xtrawineBadgeAdapter", () => {
  it("elevates card content above the full-card overlay and places badge before price", () => {
    document.body.innerHTML = `
      <li class="grid__item csr" data-product-id="8583541096619">
        <div class="card-wrapper product-card-wrapper">
          <div class="card card--standard card--media">
            <a class="position-absolute top-0 w-100 h-100 d-block" href="/products/example"></a>
            <div class="position-static card__content with-quick-add">
              <div class="card__information">
                <div class="d-flex flex-column gap-1 flex-grow-1">
                  <div class="grid-product-vendor h4">Produttori del Barbaresco</div>
                  <div class="grid-product-title h3">
                    <a class="full-unstyled-link" href="/products/example">2022</a>
                  </div>
                </div>
                <div class="card-information">
                  <div class="price grid-product-price">€27.00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    `;

    const card = document.querySelector("li.grid__item[data-product-id]")!;
    const title = card.querySelector(".grid-product-title a.full-unstyled-link")!;
    const badgeHost = document.createElement("div");
    badgeHost.setAttribute(BADGE_ATTR, "true");

    xtrawineBadgeAdapter.insertBadge({
      anchorElement: title,
      badgeHost,
      productCard: card,
    });

    const cardContent = card.querySelector(
      ".card__content.with-quick-add",
    ) as HTMLElement;
    expect(cardContent.style.getPropertyValue("position")).toBe("relative");
    expect(cardContent.style.getPropertyPriority("position")).toBe("important");
    expect(cardContent.style.getPropertyValue("z-index")).toBe("2");
    expect(badgeHost.style.getPropertyValue("z-index")).toBe("10");
    expect(badgeHost.style.pointerEvents).toBe("auto");
    expect(badgeHost.nextElementSibling?.classList.contains("card-information")).toBe(
      true,
    );
  });
});
