import { describe, expect, it } from "vitest";
import { computeStackedTriggerBottom } from "../../src/content/floating-button";

describe("computeStackedTriggerBottom", () => {
  it("places FAB bottom above Smile launcher with gap on 800px viewport", () => {
    // Smile pill: top 720, height 60, 20px from viewport bottom.
    expect(computeStackedTriggerBottom(800, 720, 16)).toBe(96);
    expect(computeStackedTriggerBottom(800, 720, 24)).toBe(104);
  });

  it("tracks taller viewports where launcher stays pinned to bottom", () => {
    expect(computeStackedTriggerBottom(900, 820, 24)).toBe(104);
  });
});
