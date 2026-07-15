import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  extractUpdateZip,
  normalizeZipEntries,
  validateUpdateFiles,
} from "../../src/shared/apply-update";
import { isUpdateSnoozed } from "../../src/shared/update-snooze";

describe("apply-update", () => {
  it("keeps root-level zip entries when manifest.json is at root", () => {
    const files = normalizeZipEntries([
      { path: "manifest.json", data: new Uint8Array([1]) },
      { path: "assets/main.js", data: new Uint8Array([2]) },
    ]);
    expect(files.map((f) => f.path)).toEqual([
      "manifest.json",
      "assets/main.js",
    ]);
  });

  it("strips a single top-level folder from nested zips", () => {
    const files = normalizeZipEntries([
      {
        path: "drink-good/manifest.json",
        data: new Uint8Array([1]),
      },
      {
        path: "drink-good/assets/main.js",
        data: new Uint8Array([2]),
      },
    ]);
    expect(files.map((f) => f.path)).toEqual([
      "manifest.json",
      "assets/main.js",
    ]);
  });

  it("rejects zips without manifest.json", () => {
    expect(() =>
      validateUpdateFiles([{ path: "readme.txt", data: new Uint8Array([]) }]),
    ).toThrow(/manifest\.json/);
  });

  it("extracts a real zip buffer into normalized files", async () => {
    const zip = new JSZip();
    zip.file("manifest.json", '{"name":"Drink Good","version":"0.0.7"}');
    zip.file("service-worker-loader.js", "export {};");
    const bytes = await zip.generateAsync({ type: "arraybuffer" });

    const files = await extractUpdateZip(bytes);
    expect(files.some((f) => f.path === "manifest.json")).toBe(true);
    expect(files.some((f) => f.path === "service-worker-loader.js")).toBe(true);
  });
});

describe("update-snooze", () => {
  it("snoozes only the matching version before expiry", () => {
    const now = 1_000_000;
    expect(
      isUpdateSnoozed("0.0.7", { version: "0.0.7", untilMs: now + 1 }, now),
    ).toBe(true);
    expect(
      isUpdateSnoozed("0.0.7", { version: "0.0.7", untilMs: now - 1 }, now),
    ).toBe(false);
    expect(
      isUpdateSnoozed("0.0.8", { version: "0.0.7", untilMs: now + 1 }, now),
    ).toBe(false);
    expect(isUpdateSnoozed("0.0.7", null, now)).toBe(false);
  });
});
