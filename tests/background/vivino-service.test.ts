import { describe, expect, it, vi, beforeEach } from "vitest";
import { VivinoService, resetVivinoServiceForTests } from "../../src/background/vivino-service";
import { handleRequest } from "../../src/background/service-worker";
import type { VivinoMatchResult } from "../../src/vivino/types";

const matchedResult: VivinoMatchResult = {
  status: "matched",
  confidence: 0.92,
  candidate: {
    wineId: 1,
    vintageId: 2,
    matchedName: "Test Wine 2019",
    vintage: 2019,
    stats: { ratingsAverage: 4.3, ratingsCount: 100 },
    vivinoUrl: "https://www.vivino.com/test/w/1?year=2019",
    winery: "Test",
    source: "algolia",
  },
};

describe("VivinoService", () => {
  beforeEach(() => {
    resetVivinoServiceForTests();
  });

  it("clears session cache", async () => {
    const mockClient = {
      cacheSize: vi.fn().mockReturnValue(0),
      clearCache: vi.fn(),
      searchWine: vi.fn().mockResolvedValue(matchedResult),
    };
    const service = new VivinoService(mockClient as never);
    await service.searchWine("Test Wine 2019");
    service.clearCache();
    expect(mockClient.clearCache).toHaveBeenCalled();
  });

  it("queues searches sequentially", async () => {
    const order: string[] = [];
    const mockClient = {
      cacheSize: vi.fn().mockReturnValue(0),
      clearCache: vi.fn(),
      searchWine: vi.fn().mockImplementation(async (title: string) => {
        order.push(`start:${title}`);
        await new Promise((r) => setTimeout(r, 30));
        order.push(`end:${title}`);
        return matchedResult;
      }),
    };
    const service = new VivinoService(mockClient as never);
    const p1 = service.searchWine("Wine A");
    const p2 = service.searchWine("Wine B");
    await Promise.all([p1, p2]);
    expect(order.indexOf("end:Wine A")).toBeLessThan(order.indexOf("start:Wine B"));
  });
});

describe("handleRequest", () => {
  beforeEach(() => {
    resetVivinoServiceForTests();
    vi.restoreAllMocks();
  });

  it("returns PONG", async () => {
    const response = await handleRequest({ type: "PING" }, {});
    expect(response).toEqual({ type: "PONG" });
  });

  it("clears vivino cache via message", async () => {
    const response = await handleRequest({ type: "VIVINO_CLEAR_CACHE" }, {});
    expect(response.type).toBe("VIVINO_CACHE_CLEARED");
  });

  it("detects wineview adapter from explicit tabUrl", async () => {
    const response = await handleRequest(
      {
        type: "GET_STATUS",
        tabUrl:
          "https://wineview.com.hk/product-category/wine-shop/red-wine/",
      },
      {},
    );
    expect(response.type).toBe("STATUS");
    if (response.type === "STATUS") {
      expect(response.status.activeAdapterId).toBe("wineview");
      expect(response.status.logLineCount).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns logs and clears them", async () => {
    await handleRequest(
      { type: "LOG", level: "info", message: "test entry" },
      {},
    );
    const logs = await handleRequest({ type: "GET_LOGS" }, {});
    expect(logs.type).toBe("LOGS");
    if (logs.type === "LOGS") {
      expect(logs.text).toContain("test entry");
    }
    const cleared = await handleRequest({ type: "CLEAR_LOGS" }, {});
    expect(cleared.type).toBe("LOGS_CLEARED");
  });

  it("clears logs silently at the start of a new run", async () => {
    await handleRequest(
      { type: "LOG", level: "info", message: "previous run" },
      {},
    );
    await handleRequest({ type: "BEGIN_RUN" }, {});
    const logs = await handleRequest({ type: "GET_LOGS" }, {});
    expect(logs.type).toBe("LOGS");
    if (logs.type === "LOGS") {
      expect(logs.text).not.toContain("previous run");
      expect(logs.lineCount).toBe(0);
    }
  });
});
