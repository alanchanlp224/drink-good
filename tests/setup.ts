import { vi } from "vitest";

const storage: Record<string, unknown> = {};

vi.stubGlobal("chrome", {
  runtime: {
    getManifest: () => ({ version: "0.0.2" }),
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  tabs: {
    query: vi.fn().mockResolvedValue([]),
  },
  storage: {
    session: {
      get: vi.fn(async (keys: string | string[]) => {
        const list = Array.isArray(keys) ? keys : [keys];
        const result: Record<string, unknown> = {};
        for (const key of list) {
          if (key in storage) {
            result[key] = storage[key];
          }
        }
        return result;
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(storage, items);
      }),
      remove: vi.fn(async (keys: string | string[]) => {
        const list = Array.isArray(keys) ? keys : [keys];
        for (const key of list) {
          delete storage[key];
        }
      }),
    },
  },
});
