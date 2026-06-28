import { describe, expect, it, beforeEach } from "vitest";
import { getLogger, resetLoggerForTests, RingBufferLogger } from "../../src/core/logger";

describe("RingBufferLogger", () => {
  beforeEach(() => {
    resetLoggerForTests();
  });

  it("stores log lines with level prefix", () => {
    const logger = new RingBufferLogger();
    logger.info("hello");
    expect(logger.getText()).toMatch(/\[INFO\] hello/);
  });

  it("drops oldest lines beyond 1000", () => {
    const logger = new RingBufferLogger();
    for (let i = 0; i < 1005; i += 1) {
      logger.debug(`line-${i}`);
    }
    expect(logger.lineCount()).toBe(1000);
    expect(logger.getText()).not.toContain("line-0");
    expect(logger.getText()).toContain("line-1004");
  });

  it("clears all lines", () => {
    const logger = getLogger();
    logger.info("test");
    logger.clear();
    expect(logger.lineCount()).toBe(0);
  });
});
