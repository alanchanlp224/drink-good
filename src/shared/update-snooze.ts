/** Snooze in-app update prompts in chrome.storage.local. */

const SNOOZE_KEY = "drinkGoodUpdateSnooze";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export interface UpdateSnoozeState {
  version: string;
  untilMs: number;
}

/** True when the given release version should stay hidden. */
export function isUpdateSnoozed(
  version: string,
  snooze: UpdateSnoozeState | null,
  nowMs: number = Date.now(),
): boolean {
  if (!snooze) {
    return false;
  }
  return snooze.version === version && snooze.untilMs > nowMs;
}

/** Persist a 7-day snooze for this release version. */
export async function snoozeUpdate(version: string): Promise<void> {
  const state: UpdateSnoozeState = {
    version,
    untilMs: Date.now() + SNOOZE_MS,
  };
  await chrome.storage.local.set({ [SNOOZE_KEY]: state });
}

/** Load snooze state, or null. */
export async function loadUpdateSnooze(): Promise<UpdateSnoozeState | null> {
  const result = await chrome.storage.local.get(SNOOZE_KEY);
  const value = result[SNOOZE_KEY];
  if (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    "untilMs" in value &&
    typeof (value as UpdateSnoozeState).version === "string" &&
    typeof (value as UpdateSnoozeState).untilMs === "number"
  ) {
    return value as UpdateSnoozeState;
  }
  return null;
}

export { SNOOZE_KEY, SNOOZE_MS };
