import { downloadAndApplyUpdate } from "../shared/apply-update";
import { GITHUB_REPO } from "../shared/config";
import { compareSemver, parseSemverCore } from "../shared/github-update";
import { ensureInstallFolder } from "../shared/install-folder";
import type { UpdateAvailableInfo } from "../shared/messages";
import { sendBackgroundRequest } from "../shared/runtime";
import {
  isUpdateSnoozed,
  loadUpdateSnooze,
  snoozeUpdate,
} from "../shared/update-snooze";

const versionEl = document.querySelector<HTMLElement>("#version");
const brandIconEl = document.querySelector<HTMLImageElement>("#brand-icon");
const processingStatusEl = document.querySelector<HTMLElement>("#processing-status");
const adapterIdEl = document.querySelector<HTMLElement>("#adapter-id");
const cacheSizeEl = document.querySelector<HTMLElement>("#cache-size");
const logCountEl = document.querySelector<HTMLElement>("#log-count");
const updateBannerEl = document.querySelector<HTMLElement>("#update-banner");
const updateVersionEl = document.querySelector<HTMLElement>("#update-version");
const updateLinkEl = document.querySelector<HTMLAnchorElement>("#update-link");
const updateNowBtn = document.querySelector<HTMLButtonElement>("#update-now");
const updateLaterBtn = document.querySelector<HTMLButtonElement>("#update-later");
const updateProgressEl = document.querySelector<HTMLElement>("#update-progress");
const downloadLogBtn = document.querySelector<HTMLButtonElement>("#download-log");
const clearLogBtn = document.querySelector<HTMLButtonElement>("#clear-log");
const clearCacheBtn = document.querySelector<HTMLButtonElement>("#clear-cache");
const changeInstallFolderBtn = document.querySelector<HTMLButtonElement>(
  "#change-install-folder",
);
const feedbackEl = document.querySelector<HTMLElement>("#feedback");

let pendingUpdate: UpdateAvailableInfo | null = null;
let updateInProgress = false;

function showFeedback(message: string, isError = false): void {
  if (!feedbackEl) {
    return;
  }
  feedbackEl.hidden = false;
  feedbackEl.textContent = message;
  feedbackEl.classList.toggle("error", isError);
}

function setUpdateProgress(message: string | null): void {
  if (!updateProgressEl) {
    return;
  }
  if (!message) {
    updateProgressEl.hidden = true;
    updateProgressEl.textContent = "";
    return;
  }
  updateProgressEl.hidden = false;
  updateProgressEl.textContent = message;
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

  if (updateBannerEl && updateVersionEl && updateLinkEl) {
    const release = status.updateAvailable;
    const snooze = await loadUpdateSnooze();
    const hasNewerRelease =
      release &&
      release.zipBrowserDownloadUrl &&
      GITHUB_REPO &&
      parseSemverCore(release.version) &&
      compareSemver(release.version, status.version) > 0 &&
      !isUpdateSnoozed(release.version, snooze);

    if (hasNewerRelease && release) {
      pendingUpdate = release;
      updateBannerEl.hidden = false;
      updateVersionEl.textContent = `v${release.version}`;
      updateLinkEl.href =
        release.releaseHtmlUrl ||
        `https://github.com/${GITHUB_REPO}/releases/latest`;
    } else {
      pendingUpdate = null;
      updateBannerEl.hidden = true;
      updateVersionEl.textContent = "";
      updateLinkEl.removeAttribute("href");
    }
  }
}

async function runUpdate(): Promise<void> {
  if (updateInProgress || !pendingUpdate?.zipBrowserDownloadUrl) {
    return;
  }

  const version = pendingUpdate.version;
  const zipUrl = pendingUpdate.zipBrowserDownloadUrl;
  const confirmed = window.confirm(
    `Install Drink Good v${version}?\n\n` +
      `You will be asked to choose the same folder you used for “Load unpacked” ` +
      `(or we reuse a previously chosen folder).\n\n` +
      `Chrome will reload the extension after the update.`,
  );
  if (!confirmed) {
    return;
  }

  updateInProgress = true;
  if (updateNowBtn) {
    updateNowBtn.disabled = true;
  }
  if (updateLaterBtn) {
    updateLaterBtn.disabled = true;
  }

  try {
    setUpdateProgress("Granting install folder access…");
    const folder = await ensureInstallFolder(false);
    setUpdateProgress(`Downloading v${version}…`);
    await downloadAndApplyUpdate(zipUrl, folder);
    setUpdateProgress("Installed. Reloading…");
    chrome.runtime.reload();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Update failed";
    setUpdateProgress(null);
    showFeedback(message, true);
  } finally {
    updateInProgress = false;
    if (updateNowBtn) {
      updateNowBtn.disabled = false;
    }
    if (updateLaterBtn) {
      updateLaterBtn.disabled = false;
    }
  }
}

async function deferUpdate(): Promise<void> {
  if (!pendingUpdate) {
    return;
  }
  await snoozeUpdate(pendingUpdate.version);
  if (updateBannerEl) {
    updateBannerEl.hidden = true;
  }
  showFeedback(`Update to v${pendingUpdate.version} snoozed for 7 days`);
  pendingUpdate = null;
}

async function changeInstallFolder(): Promise<void> {
  try {
    await ensureInstallFolder(true);
    showFeedback("Install folder saved for future updates");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Could not save folder";
    showFeedback(message, true);
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

updateNowBtn?.addEventListener("click", () => {
  runUpdate().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Update failed";
    showFeedback(message, true);
  });
});

updateLaterBtn?.addEventListener("click", () => {
  deferUpdate().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Snooze failed";
    showFeedback(message, true);
  });
});

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

changeInstallFolderBtn?.addEventListener("click", () => {
  changeInstallFolder().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Could not change folder";
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
  if (!updateInProgress) {
    refreshStatus().catch(() => undefined);
  }
}, 2000);
