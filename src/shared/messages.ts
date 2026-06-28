/** Extension messaging between popup, content scripts, and service worker. */

import type { LogLevel } from "../core/logger";
import type { VivinoMatchResult } from "../vivino/types";

export type ProcessingStatus = "idle" | "running" | "stopped";

export interface ExtensionStatus {
  version: string;
  processingStatus: ProcessingStatus;
  queueProcessed: number;
  queueTotal: number;
  vivinoCacheSize: number;
  logLineCount: number;
  activeAdapterId: string | null;
  updateAvailable: string | null;
}

export type BackgroundRequest =
  | { type: "GET_STATUS"; tabUrl?: string }
  | { type: "VIVINO_SEARCH"; wineTitle: string; adapterId?: string }
  | { type: "VIVINO_CLEAR_CACHE" }
  | { type: "SET_PROCESSING_STATE"; status: ProcessingStatus; processed?: number; total?: number }
  | { type: "LOG"; level: LogLevel; message: string }
  | { type: "GET_LOGS" }
  | { type: "CLEAR_LOGS" }
  | { type: "PING" };

export type BackgroundResponse =
  | { type: "STATUS"; status: ExtensionStatus }
  | { type: "VIVINO_RESULT"; result: VivinoMatchResult }
  | { type: "VIVINO_CACHE_CLEARED"; cacheSize: number }
  | { type: "LOGS"; text: string; lineCount: number }
  | { type: "LOGS_CLEARED"; lineCount: number }
  | { type: "PONG" }
  | { type: "ERROR"; message: string };

export function isBackgroundResponse(value: unknown): value is BackgroundResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as BackgroundResponse).type === "string"
  );
}
