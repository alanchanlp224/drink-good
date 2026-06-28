#!/usr/bin/env bash
# Download the latest Drink Good release zip and replace an unpacked extension folder.
set -euo pipefail

GITHUB_REPO="${GITHUB_REPO:-alanchanlp224/drink-good}"
ZIP_NAME="drink-good.zip"
API_URL="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"

usage() {
  cat <<EOF
Usage: $0 <extension-folder>

Downloads ${ZIP_NAME} from the latest GitHub release and replaces the contents
of <extension-folder> (the folder you selected in chrome://extensions → Load unpacked).

Example:
  $0 "\$HOME/Extensions/drink-good"

Override repo: GITHUB_REPO=owner/repo $0 /path/to/folder
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -lt 1 ]]; then
  usage
  exit 0
fi

TARGET_DIR="$1"
if [[ ! -d "$TARGET_DIR" ]]; then
  echo "Target folder does not exist: $TARGET_DIR" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Fetching latest release from ${GITHUB_REPO}..."
RELEASE_JSON="$(curl -fsSL "$API_URL")"
DOWNLOAD_URL="$(
  echo "$RELEASE_JSON" | python3 -c '
import json
import sys

zip_name = sys.argv[1]
data = json.load(sys.stdin)
for asset in data.get("assets", []):
    if asset.get("name") == zip_name:
        print(asset["browser_download_url"])
        break
' "$ZIP_NAME"
)"

if [[ -z "$DOWNLOAD_URL" ]]; then
  echo "No ${ZIP_NAME} asset on latest release. Publish a release with the CI zip first." >&2
  exit 1
fi

TAG_NAME="$(python3 -c 'import json,sys; print(json.load(sys.stdin)["tag_name"])' <<<"$RELEASE_JSON")"
echo "Downloading ${TAG_NAME}..."
curl -fsSL -o "$TMP_DIR/$ZIP_NAME" "$DOWNLOAD_URL"

EXTRACT_DIR="$TMP_DIR/extract"
mkdir -p "$EXTRACT_DIR"
unzip -q -o "$TMP_DIR/$ZIP_NAME" -d "$EXTRACT_DIR"

echo "Updating ${TARGET_DIR}..."
rsync -a --delete "$EXTRACT_DIR/" "$TARGET_DIR/"

echo "Done. Open chrome://extensions and click Reload on Drink Good."
