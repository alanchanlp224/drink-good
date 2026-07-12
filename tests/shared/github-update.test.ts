import { describe, expect, it } from "vitest";
import {
  compareSemver,
  parseSemverCore,
  RELEASE_ZIP_NAME,
} from "../../src/shared/github-update";

describe("github-update", () => {
  it("parses semver core", () => {
    expect(parseSemverCore("v1.2.3")).toEqual([1, 2, 3]);
    expect(parseSemverCore("0.0.10-beta")).toEqual([0, 0, 10]);
    expect(parseSemverCore("bad")).toBeNull();
  });

  it("compares semver versions", () => {
    expect(compareSemver("0.0.2", "0.0.1")).toBe(1);
    expect(compareSemver("0.0.10", "0.0.9")).toBe(1);
    expect(compareSemver("0.0.1", "0.0.1")).toBe(0);
    expect(compareSemver("0.0.1", "0.0.2")).toBe(-1);
  });

  it("uses drink-good zip asset name", () => {
    expect(RELEASE_ZIP_NAME).toBe("drink-good.zip");
  });

  it("treats equal release and installed versions as no update", () => {
    expect(compareSemver("0.0.3", "0.0.3")).toBe(0);
    expect(compareSemver("v0.0.3", "0.0.3")).toBe(0);
  });
});
