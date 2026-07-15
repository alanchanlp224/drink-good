/** Drink Good MV3 service worker — Vivino search, logging, and extension state. */

import { getLogger } from "../core/logger";
import { getAdapterForUrl } from "../core/adapter-registry";
import { checkForNewerRelease } from "../shared/github-update";
import type {
  BackgroundRequest,
  BackgroundResponse,
  ExtensionStatus,
  ProcessingStatus,
  UpdateAvailableInfo,
} from "../shared/messages";
import { getVivinoService } from "./vivino-service";

const EXTENSION_VERSION = chrome.runtime.getManifest().version;

let processingStatus: ProcessingStatus = "idle";
let queueProcessed = 0;
let queueTotal = 0;
let cachedLatestRelease: UpdateAvailableInfo | null = null;
let releaseCheckPromise: Promise<UpdateAvailableInfo | null> | null = null;

function buildStatus(activeAdapterId: string | null): ExtensionStatus {
  return {
    version: EXTENSION_VERSION,
    processingStatus,
    queueProcessed,
    queueTotal,
    vivinoCacheSize: getVivinoService().cacheSize,
    logLineCount: getLogger().lineCount(),
    activeAdapterId,
    updateAvailable: cachedLatestRelease,
  };
}

async function resolveTabUrl(
  request: Extract<BackgroundRequest, { type: "GET_STATUS" }>,
  sender: chrome.runtime.MessageSender,
): Promise<string | null> {
  if (request.tabUrl) {
    return request.tabUrl;
  }
  if (sender.tab?.url) {
    return sender.tab.url;
  }
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab?.url ?? null;
}

async function checkForUpdate(): Promise<UpdateAvailableInfo | null> {
  if (releaseCheckPromise) {
    return releaseCheckPromise;
  }

  releaseCheckPromise = (async () => {
    try {
      const latest = await checkForNewerRelease(EXTENSION_VERSION);
      if (!latest?.zipBrowserDownloadUrl) {
        cachedLatestRelease = null;
        return null;
      }
      cachedLatestRelease = {
        version: latest.version,
        releaseHtmlUrl: latest.releaseHtmlUrl,
        zipBrowserDownloadUrl: latest.zipBrowserDownloadUrl,
      };
      return cachedLatestRelease;
    } catch {
      cachedLatestRelease = null;
      return null;
    } finally {
      releaseCheckPromise = null;
    }
  })();

  return releaseCheckPromise;
}

async function handleRequest(
  request: BackgroundRequest,
  sender: chrome.runtime.MessageSender,
): Promise<BackgroundResponse> {
  const logger = getLogger();

  switch (request.type) {
    case "PING":
      return { type: "PONG" };

    case "GET_STATUS": {
      const tabUrl = await resolveTabUrl(request, sender);
      const adapter = tabUrl ? getAdapterForUrl(tabUrl) : null;
      await checkForUpdate();
      return {
        type: "STATUS",
        status: buildStatus(adapter?.id ?? null),
      };
    }

    case "SET_PROCESSING_STATE": {
      processingStatus = request.status;
      queueProcessed = request.processed ?? queueProcessed;
      queueTotal = request.total ?? queueTotal;
      logger.info(
        `Processing ${request.status} (${queueProcessed}/${queueTotal})`,
      );
      return {
        type: "STATUS",
        status: buildStatus(null),
      };
    }

    case "LOG": {
      logger.log(request.level, request.message);
      return { type: "PONG" };
    }

    case "GET_LOGS":
      return {
        type: "LOGS",
        text: logger.getText(),
        lineCount: logger.lineCount(),
      };

    case "CLEAR_LOGS": {
      logger.clear();
      logger.info("Log cleared by user");
      return { type: "LOGS_CLEARED", lineCount: 0 };
    }

    case "BEGIN_RUN": {
      logger.clear();
      getVivinoService().clearCache();
      return { type: "PONG" };
    }

    case "VIVINO_SEARCH": {
      logger.info(
        `Vivino search: "${request.wineTitle}"${request.adapterId ? ` [${request.adapterId}]` : ""}`,
      );
      const result = await getVivinoService().searchWine(request.wineTitle);
      if (result.status === "matched") {
        const scope = result.candidate.stats.scoreScope ?? "vintage";
        logger.info(
          `Match: "${result.candidate.matchedName}" score=${result.candidate.stats.ratingsAverage ?? "n/a"} (${scope}) confidence=${result.confidence.toFixed(2)}`,
        );
      } else {
        logger.warn(`No match: ${result.reason}`);
      }
      return { type: "VIVINO_RESULT", result };
    }

    case "VIVINO_CLEAR_CACHE": {
      getVivinoService().clearCache();
      logger.info("Vivino cache cleared");
      return {
        type: "VIVINO_CACHE_CLEARED",
        cacheSize: getVivinoService().cacheSize,
      };
    }

    default:
      return { type: "ERROR", message: "Unknown request type" };
  }
}

chrome.runtime.onMessage.addListener((message: BackgroundRequest, sender, sendResponse) => {
  handleRequest(message, sender)
    .then(sendResponse)
    .catch((error: unknown) => {
      const messageText =
        error instanceof Error ? error.message : "Unknown service worker error";
      getLogger().error(messageText);
      sendResponse({ type: "ERROR", message: messageText } satisfies BackgroundResponse);
    });
  return true;
});

export function setProcessingState(
  status: ProcessingStatus,
  processed = 0,
  total = 0,
): void {
  processingStatus = status;
  queueProcessed = processed;
  queueTotal = total;
}

export { buildStatus, handleRequest };
