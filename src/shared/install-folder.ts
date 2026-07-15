/** Persist the Load-unpacked extension folder via File System Access API. */

import { asWritableDirectory } from "./fs-access";

const DB_NAME = "drink-good-install";
const DB_VERSION = 1;
const STORE_NAME = "handles";
const HANDLE_KEY = "install-folder";

type DirectoryPickerOptions = {
  id?: string;
  mode?: "read" | "readwrite";
};

declare global {
  interface Window {
    showDirectoryPicker?: (
      options?: DirectoryPickerOptions,
    ) => Promise<FileSystemDirectoryHandle>;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open install-folder DB"));
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/** Store a directory handle for later updates. */
export async function saveInstallFolder(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(tx.error ?? new Error("Failed to save install folder handle"));
    };
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
  });
  db.close();
}

/** Load the previously granted install folder, if any. */
export async function loadInstallFolder(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDb();
  const handle = await new Promise<FileSystemDirectoryHandle | null>(
    (resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      request.onerror = () => {
        reject(request.error ?? new Error("Failed to load install folder"));
      };
      request.onsuccess = () => {
        const value = request.result;
        resolve(value instanceof FileSystemDirectoryHandle ? value : null);
      };
    },
  );
  db.close();
  return handle;
}

/** Prompt the user to pick the Load unpacked folder (readwrite). */
export async function requestInstallFolder(): Promise<FileSystemDirectoryHandle> {
  if (typeof window.showDirectoryPicker !== "function") {
    throw new Error(
      "This browser cannot grant a folder for in-app updates. Use scripts/update.sh instead.",
    );
  }

  const handle = await window.showDirectoryPicker({
    id: "drink-good-install",
    mode: "readwrite",
  });
  await saveInstallFolder(handle);
  return handle;
}

/**
 * Ensure we have a readwrite-capable install folder handle.
 * Re-requests permission or opens the picker when needed.
 */
export async function ensureInstallFolder(
  forcePick = false,
): Promise<FileSystemDirectoryHandle> {
  if (!forcePick) {
    const existing = await loadInstallFolder();
    if (existing) {
      const writable = asWritableDirectory(existing);
      const query = await writable.queryPermission({ mode: "readwrite" });
      if (query === "granted") {
        return existing;
      }
      const requested = await writable.requestPermission({ mode: "readwrite" });
      if (requested === "granted") {
        return existing;
      }
    }
  }

  return requestInstallFolder();
}
