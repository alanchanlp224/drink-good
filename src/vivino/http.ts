/** Rate-limited fetch with retries for Vivino endpoints. */

export class RateLimiter {
  private lastRequestAt = 0;

  constructor(private readonly minIntervalMs: number) {}

  async waitTurn(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit,
  options: {
    fetchFn?: typeof fetch;
    rateLimiter?: RateLimiter;
    maxRetries?: number;
  } = {},
): Promise<T> {
  const fetchFn = options.fetchFn ?? fetch;
  const maxRetries = options.maxRetries ?? 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    await options.rateLimiter?.waitTurn();

    try {
      const response = await fetchFn(url, init);
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`transient HTTP ${response.status}`);
      }
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await sleep(2 ** attempt * 500);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Vivino request failed");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
