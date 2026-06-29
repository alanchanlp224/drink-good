import { GITHUB_REPO } from "../shared/config";
import { compareSemver, parseSemverCore } from "../shared/github-update";
import { sendBackgroundRequest } from "../shared/runtime";

const versionEl = document.querySelector<HTMLElement>("#version");
const brandIconEl = document.querySelector<HTMLImageElement>("#brand-icon");
const processingStatusEl = document.querySelector<HTMLElement>("#processing-status");
const adapterIdEl = document.querySelector<HTMLElement>("#adapter-id");
const cacheSizeEl = document.querySelector<HTMLElement>("#cache-size");
const logCountEl = document.querySelector<HTMLElement>("#log-count");
const updateBannerEl = document.querySelector<HTMLElement>("#update-banner");
const updateLinkEl = document.querySelector<HTMLAnchorElement>("#update-link");
const downloadLogBtn = document.querySelector<HTMLButtonElement>("#download-log");
const clearLogBtn = document.querySelector<HTMLButtonElement>("#clear-log");
const clearCacheBtn = document.querySelector<HTMLButtonElement>("#clear-cache");
const feedbackEl = document.querySelector<HTMLElement>("#feedback");

function showFeedback(message: string, isError = false): void {
  if (!feedbackEl) {
    return;
  }
  feedbackEl.hidden = false;
  feedbackEl.textContent = message;
  feedbackEl.classList.toggle("error", isError);
}

async function getActiveTabUrl(): Promise<string | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url;
}

async function refreshStatus(): Promise<void> {
  const tabUrl = await getActiveTabUrl();
  const response = await sendBackgroundRequest({
    type: "GET_STATUS",
    tabUrl,
  });
  if (response.type !== "STATUS") {
    return;
  }

  const { status } = response;
  if (versionEl) {
    versionEl.textContent = `v${status.version}`;
  }
  if (processingStatusEl) {
    const detail =
      status.processingStatus === "running"
        ? `${status.processingStatus} (${status.queueProcessed}/${status.queueTotal})`
        : status.processingStatus;
    processingStatusEl.textContent = detail;
    processingStatusEl.setAttribute("data-state", status.processingStatus);
  }
  if (adapterIdEl) {
    adapterIdEl.textContent = status.activeAdapterId ?? "unsupported site";
  }
  if (cacheSizeEl) {
    cacheSizeEl.textContent = String(status.vivinoCacheSize);
  }
  if (logCountEl) {
    logCountEl.textContent = String(status.logLineCount);
  }

  if (updateBannerEl && updateLinkEl) {
    const releaseVersion = status.updateAvailable;
    const hasNewerRelease =
      releaseVersion &&
      GITHUB_REPO &&
      parseSemverCore(releaseVersion) &&
      compareSemver(releaseVersion, status.version) > 0;
    if (hasNewerRelease) {
      updateBannerEl.hidden = false;
      updateLinkEl.textContent = `v${releaseVersion}`;
      updateLinkEl.href = `https://github.com/${GITHUB_REPO}/releases/latest`;
    } else {
      updateBannerEl.hidden = true;
      updateLinkEl.textContent = "";
      updateLinkEl.removeAttribute("href");
    }
  }
}

async function downloadLog(): Promise<void> {
  const response = await sendBackgroundRequest({ type: "GET_LOGS" });
  if (response.type !== "LOGS") {
    return;
  }

  const blob = new Blob([response.text || "(empty log)"], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `drink-good-log-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  showFeedback(`Downloaded ${response.lineCount} log line(s)`);
}

async function clearLog(): Promise<void> {
  const response = await sendBackgroundRequest({ type: "CLEAR_LOGS" });
  if (response.type === "LOGS_CLEARED") {
    showFeedback("Log cleared");
    if (logCountEl) {
      logCountEl.textContent = "0";
    }
  }
}

async function clearCache(): Promise<void> {
  const response = await sendBackgroundRequest({ type: "VIVINO_CLEAR_CACHE" });
  if (response.type === "VIVINO_CACHE_CLEARED") {
    showFeedback("Vivino cache cleared");
    if (cacheSizeEl) {
      cacheSizeEl.textContent = String(response.cacheSize);
    }
  }
}

downloadLogBtn?.addEventListener("click", () => {
  downloadLog().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Download failed";
    showFeedback(message, true);
  });
});

clearLogBtn?.addEventListener("click", () => {
  clearLog().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Clear log failed";
    showFeedback(message, true);
  });
});

clearCacheBtn?.addEventListener("click", () => {
  clearCache().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Clear cache failed";
    showFeedback(message, true);
  });
});

if (brandIconEl) {
  brandIconEl.src = chrome.runtime.getURL("public/icon-48.png");
}

refreshStatus().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Failed to load status";
  showFeedback(message, true);
});

setInterval(() => {
  refreshStatus().catch(() => undefined);
}, 2000);
