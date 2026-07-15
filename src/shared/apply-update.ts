/** Download a GitHub release zip and overwrite a granted install folder. */

import JSZip from "jszip";

import { asWritableDirectory } from "./fs-access";

export interface ExtractedUpdateFile {
  /** Path relative to install root, using `/` separators. */
  path: string;
  data: Uint8Array;
}

const STAGING_DIR = ".drink-good-update-staging";

/**
 * Normalize zip entry paths and strip a single top-level folder when present.
 * Our release zips put files at the root; GitHub source zips nest under one folder.
 */
export function normalizeZipEntries(
  entries: ExtractedUpdateFile[],
): ExtractedUpdateFile[] {
  const cleaned = entries
    .map((entry) => ({
      path: entry.path.replace(/\\/g, "/").replace(/^\/+/, ""),
      data: entry.data,
    }))
    .filter((entry) => entry.path.length > 0 && !entry.path.endsWith("/"));

  if (cleaned.length === 0) {
    return [];
  }

  const hasRootManifest = cleaned.some((entry) => entry.path === "manifest.json");
  if (hasRootManifest) {
    return cleaned;
  }

  const topLevels = new Set(
    cleaned.map((entry) => entry.path.split("/")[0] ?? entry.path),
  );
  if (topLevels.size !== 1) {
    return cleaned;
  }

  const [prefix] = topLevels;
  const stripped = cleaned
    .filter((entry) => entry.path.startsWith(`${prefix}/`))
    .map((entry) => ({
      path: entry.path.slice(prefix.length + 1),
      data: entry.data,
    }))
    .filter((entry) => entry.path.length > 0);

  return stripped;
}

/** Require a Chrome extension manifest at the install root. */
export function validateUpdateFiles(files: ExtractedUpdateFile[]): void {
  if (!files.some((file) => file.path === "manifest.json")) {
    throw new Error("Update zip is missing manifest.json");
  }
}

/** Load zip bytes into normalized file entries. */
export async function extractUpdateZip(
  zipBytes: ArrayBuffer,
): Promise<ExtractedUpdateFile[]> {
  const zip = await JSZip.loadAsync(zipBytes);
  const raw: ExtractedUpdateFile[] = [];

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) {
      continue;
    }
    const data = await entry.async("uint8array");
    raw.push({ path: name, data });
  }

  const files = normalizeZipEntries(raw);
  validateUpdateFiles(files);
  return files;
}

async function writeFilesToDirectory(
  dir: FileSystemDirectoryHandle,
  files: ExtractedUpdateFile[],
): Promise<void> {
  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    if (parts.length === 0) {
      continue;
    }

    let current = dir;
    for (let index = 0; index < parts.length - 1; index += 1) {
      current = await current.getDirectoryHandle(parts[index], { create: true });
    }

    const fileName = parts[parts.length - 1];
    const fileHandle = await current.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    // Copy into a fresh ArrayBuffer — FileSystemWritableFileStream rejects SharedArrayBuffer views.
    await writable.write(new Blob([new Uint8Array(file.data)]));
    await writable.close();
  }
}

/**
 * Stage → validate → replace install folder contents (avoids a half-written root).
 */
export async function writeUpdateToFolder(
  root: FileSystemDirectoryHandle,
  files: ExtractedUpdateFile[],
): Promise<void> {
  validateUpdateFiles(files);

  // Remove a previous failed staging dir if present.
  try {
    await root.removeEntry(STAGING_DIR, { recursive: true });
  } catch {
    // ignore missing staging
  }

  const staging = await root.getDirectoryHandle(STAGING_DIR, { create: true });
  await writeFilesToDirectory(staging, files);

  const stagingManifest = await staging.getFileHandle("manifest.json");
  await stagingManifest.getFile();

  const writableRoot = asWritableDirectory(root);
  const toRemove: string[] = [];
  for await (const [name] of writableRoot.entries()) {
    if (name !== STAGING_DIR) {
      toRemove.push(name);
    }
  }
  for (const name of toRemove) {
    await root.removeEntry(name, { recursive: true });
  }

  await writeFilesToDirectory(root, files);
  await root.removeEntry(STAGING_DIR, { recursive: true });
}

/** Download zip from GitHub, extract, and overwrite the install folder. */
export async function downloadAndApplyUpdate(
  zipUrl: string,
  root: FileSystemDirectoryHandle,
): Promise<void> {
  const response = await fetch(zipUrl);
  if (!response.ok) {
    throw new Error(`Failed to download update (${response.status})`);
  }

  const bytes = await response.arrayBuffer();
  const files = await extractUpdateZip(bytes);
  await writeUpdateToFolder(root, files);
}
