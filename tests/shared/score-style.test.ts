import { describe, expect, it } from "vitest";
import {
  getScoreStyle,
  scoreBadgeBackground,
  scoreBadgeBorder,
} from "../../src/shared/score-style";

describe("getScoreStyle", () => {
  it("returns low (red) below 3.5", () => {
    expect(getScoreStyle(3.2)).toEqual({ id: "low", accent: "#ef4444" });
  });

  it("returns fair (amber) between 3.5 and 4.0 inclusive", () => {
    expect(getScoreStyle(3.8)).toEqual({ id: "fair", accent: "#eab308" });
    expect(getScoreStyle(4.0)).toEqual({ id: "fair", accent: "#eab308" });
  });

  it("returns excellent (green) above 4.0", () => {
    expect(getScoreStyle(4.1)).toEqual({ id: "excellent", accent: "#22c55e" });
    expect(getScoreStyle(4.7)).toEqual({ id: "excellent", accent: "#22c55e" });
  });

  it("returns unknown (grey) for missing ratings", () => {
    expect(getScoreStyle(null)).toEqual({ id: "unknown", accent: "#6b7280" });
  });
});

describe("scoreBadgeBackground", () => {
  it("appends 22 alpha for translucent tint", () => {
    expect(scoreBadgeBackground("#22c55e")).toBe("#22c55e22");
  });
});

describe("scoreBadgeBorder", () => {
  it("appends 44 alpha for border tint", () => {
    expect(scoreBadgeBorder("#22c55e")).toBe("#22c55e44");
  });
});
