/** GitHub Releases check for newer extension builds (public API, no token). */

import { GITHUB_REPO } from "./config";

export const RELEASE_ZIP_NAME = "drink-good.zip";

const GITHUB_HEADERS: HeadersInit = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

export interface LatestReleaseInfo {
  version: string;
  releaseTitle: string;
  releaseHtmlUrl: string;
  zipBrowserDownloadUrl: string | null;
}

type GitHubReleaseJson = {
  tag_name: string;
  name: string;
  html_url: string;
  assets?: { name: string; browser_download_url: string }[];
};

/** Parse `1.2.3`, `v1.2.3`, or `1.2.3-beta` into a numeric triple. */
export function parseSemverCore(version: string): [number, number, number] | null {
  const core = version.trim().replace(/^v/i, "").split(/[-+]/)[0];
  const parts = core.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length < 3 || parts.slice(0, 3).some((value) => Number.isNaN(value))) {
    return null;
  }
  return [parts[0], parts[1], parts[2]];
}

/** `-1` if a < b, `0` if equal, `1` if a > b (invalid strings compare as equal). */
export function compareSemver(a: string, b: string): number {
  const left = parseSemverCore(a);
  const right = parseSemverCore(b);
  if (!left || !right) {
    return 0;
  }
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] < right[index] ? -1 : 1;
    }
  }
  return 0;
}

function pickZipUrl(assets: GitHubReleaseJson["assets"]): string | null {
  if (!assets?.length) {
    return null;
  }
  for (const asset of assets) {
    if (asset.name === RELEASE_ZIP_NAME) {
      return asset.browser_download_url;
    }
  }
  const zipAsset = assets.find((asset) =>
    asset.name.toLowerCase().endsWith(".zip"),
  );
  return zipAsset?.browser_download_url ?? null;
}

function fromReleasePayload(data: GitHubReleaseJson): LatestReleaseInfo {
  const version = data.tag_name.trim().replace(/^v/i, "");
  return {
    version,
    releaseTitle: data.name || data.tag_name,
    releaseHtmlUrl: data.html_url,
    zipBrowserDownloadUrl: pickZipUrl(data.assets),
  };
}

/** Latest published version from GitHub Releases API. */
export async function fetchLatestRelease(
  repo: string = GITHUB_REPO,
): Promise<LatestReleaseInfo | null> {
  if (!repo) {
    return null;
  }

  const base = `https://api.github.com/repos/${repo}`;
  const latestResponse = await fetch(`${base}/releases/latest`, {
    headers: GITHUB_HEADERS,
  });

  if (latestResponse.ok) {
    return fromReleasePayload((await latestResponse.json()) as GitHubReleaseJson);
  }

  if (latestResponse.status !== 404) {
    return null;
  }

  const listResponse = await fetch(`${base}/releases?per_page=1`, {
    headers: GITHUB_HEADERS,
  });
  if (!listResponse.ok) {
    return null;
  }

  const releases = (await listResponse.json()) as GitHubReleaseJson[];
  if (!Array.isArray(releases) || releases.length === 0) {
    return null;
  }

  return fromReleasePayload(releases[0]);
}

/**
 * Returns full release info when a newer version exists; otherwise `null`.
 * Requires a downloadable zip asset for in-app install.
 */
export async function checkForNewerRelease(
  currentVersion: string,
  repo: string = GITHUB_REPO,
): Promise<LatestReleaseInfo | null> {
  if (!parseSemverCore(currentVersion)) {
    return null;
  }

  const latest = await fetchLatestRelease(repo);
  if (!latest || !parseSemverCore(latest.version)) {
    return null;
  }

  if (compareSemver(latest.version, currentVersion) <= 0) {
    return null;
  }

  if (!latest.zipBrowserDownloadUrl) {
    return null;
  }

  return latest;
}
