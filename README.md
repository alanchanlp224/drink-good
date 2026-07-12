# Drink Good

Chrome extension (Manifest V3) that overlays **Vivino scores and matched wine names** on wine retailer product listings.

**Version:** 0.0.4

## Supported wine shops

| Shop | Website |
|------|---------|
| Wineview HK | [wineview.com.hk](https://wineview.com.hk/) |
| Cru World Wine Markets | [markets.cruworldwine.com](https://markets.cruworldwine.com/) |
| Watson's Wine | [watsonswine.com](https://www.watsonswine.com/) |
| RNG Wine | [rngwine.com](https://www.rngwine.com/) |
| Remfly | [remfly.com.hk](https://remfly.com.hk/) |
| Ten Cellars | [tencellars.hk](https://www.tencellars.hk/) |
| XtraWine | [xtrawine.com](https://www.xtrawine.com/) |
| King's Wine Cellar | [kingswine.hk](https://kingswine.hk/) |

Open any supported shop in Chrome, click the **burgundy wine-glass button** (bottom-right corner), and Vivino badges appear on each product. Click a badge to open the matched wine on Vivino. Click the button again to stop scanning.

---

## Install Drink Good (Chrome)

You do **not** need to write code or install Node.js. These steps assume you have **Google Chrome** installed and have never loaded an extension before.

### Step 1 — Download the extension from GitHub

1. Open the Drink Good releases page:  
   **https://github.com/alanchanlp224/drink-good/releases**
2. At the top of the list, click the **latest release** (for example **v0.0.4**).  
   Do **not** download the source code (Source code zip/tar.gz) — that is for developers only.
3. Scroll down to the **Assets** section.
4. Click **`drink-good.zip`** to download it.  
   If you do not see Assets, click the small triangle or “Assets” label to expand it.

The file saves to your **Downloads** folder (unless your browser asks you to pick another location).

### Step 2 — Unzip and keep the folder in a permanent place

Chrome needs a **folder on disk** that contains `manifest.json`. Keep this folder somewhere permanent — if you delete it, the extension stops working.

#### macOS

1. Open **Finder** → **Downloads**.
2. Double-click **`drink-good.zip`** to unzip it.
3. You should see a folder (often named **`drink-good`**) containing files such as `manifest.json`, `public/`, and `assets/`.
4. **Move** that folder to a permanent location, for example:
   - `~/Extensions/drink-good`  
   (In Finder: **Go** → **Home**, create an **Extensions** folder if needed, drag the unzipped folder there.)

**Tip:** The folder you will select in Chrome must contain **`manifest.json`** at its top level — not a parent folder that only holds another subfolder.

#### Windows

1. Open **File Explorer** → **Downloads**.
2. Right-click **`drink-good.zip`** → **Extract All…**
3. Choose a permanent folder, for example:
   - `C:\Extensions\drink-good`
4. Click **Extract**.
5. Confirm the extracted folder contains **`manifest.json`** (along with `public`, `assets`, etc.).

### Step 3 — Turn on Developer mode in Chrome

1. Open a new Chrome tab and go to: **`chrome://extensions`**  
   (Copy and paste that into the address bar and press Enter.)
2. In the **top-right corner**, switch **Developer mode** to **On**.

You should see buttons such as **Load unpacked**, **Pack extension**, and **Update**.

### Step 4 — Load the extension

1. Click **Load unpacked**.
2. In the file picker, select the **folder** from Step 2 — the one that contains **`manifest.json`**.
   - **macOS example:** `Users/yourname/Extensions/drink-good`
   - **Windows example:** `C:\Extensions\drink-good`
3. Click **Select Folder** (Windows) or **Open** (macOS).

**Drink Good** should now appear in your extensions list with a wine-glass icon.

### Step 5 — Pin the extension (recommended)

1. Click the **puzzle piece** icon in Chrome’s toolbar (Extensions menu).
2. Find **Drink Good** and click the **pin** icon so it stays visible.

### Step 6 — Try it on a wine shop

1. Visit a supported site, for example:  
   [Wineview red wine](https://wineview.com.hk/product-category/wine-shop/red-wine/)  
   or [King's Wine Bordeaux](https://kingswine.hk/collections/bordeaux)
2. Click the **burgundy wine-glass button** at the bottom-right of the page.
3. Wait a few seconds — Vivino score badges appear on product cards.
4. Click the wine-glass button again to stop scanning.

Open the extension **popup** (click the pinned icon) to see version, status, and debug tools.

---

## Updating to a newer version

When a newer release is published, the extension **popup** shows an **Update available** banner with a link to GitHub.

### Option A — Download again (simplest)

1. Download the new **`drink-good.zip`** from [Releases](https://github.com/alanchanlp224/drink-good/releases/latest) (same steps as install).
2. Delete the **old files** inside your extension folder (or replace the whole folder).
3. Unzip the new zip into the **same folder path** you used for **Load unpacked**.
4. Go to **`chrome://extensions`** and click **Reload** on Drink Good.

### Option B — Update script

If you kept the downloaded repo or clone, you can run:

**macOS (Terminal):**

```bash
chmod +x scripts/update.sh
./scripts/update.sh "$HOME/Extensions/drink-good"
```

**Windows (PowerShell):**

```powershell
.\scripts\update.ps1 "C:\Extensions\drink-good"
```

Replace the path with the folder you selected in **Load unpacked**. Then **Reload** the extension on `chrome://extensions`.

---

## Development

For contributors building from source:

```bash
npm install
npm run build           # production build → dist/
npm run dev             # watch mode for extension development
npm test                # unit tests
npm run test:e2e        # Playwright E2E (live Vivino + retailer pages)
npm run test:vivino:live  # live Vivino API smoke test
```

### Load unpacked from source

1. Run `npm run build`
2. Open `chrome://extensions` → enable **Developer mode**
3. **Load unpacked** → select the **`dist/`** folder in this repo
4. After code changes, rebuild and click **Reload** on `chrome://extensions`

### Publishing a release (maintainers)

```bash
git tag v0.0.4
git push origin v0.0.4
```

GitHub Actions builds **`drink-good.zip`** and attaches it to the release. Local packaging: `npm run package`.

See [RELEASE_NOTES.md](./RELEASE_NOTES.md) for the current release notes.

---

## How it works

1. **Floating trigger** — Burgundy glass button on supported retailer pages only
2. **Extract** — Per-site adapter reads product titles from the DOM
3. **Match** — Service worker queries Vivino (Algolia + Explore fallback), applies name/vintage matching
4. **Badge** — Shadow DOM badge per product: `★ 4.3 (713) — Château Lynch-Bages Pauillac (Grand Cru Classé) 2019`
5. **Popup** — Version, adapter, cache size, processing status; debug tools for logs

## Badge behavior

| Aspect | Detail |
|--------|--------|
| **Content** | Gold star + Vivino score + review count + full matched Vivino name |
| **Colors** | Score-based tint (green >4.0, amber 3.5–4.0, red <3.5, grey no match) |
| **No match** | Grey `?` badge with reason in tooltip |
| **Click** | Opens Vivino wine page (does not follow the shop product link) |

Per-retailer placement is configured via `BadgeAdapter` on each `RetailerAdapter` (see `src/adapters/`).

## Project structure

```
src/
  adapters/         # Per-retailer DOM, normalization, badge config
  background/       # Service worker + Vivino service
  content/          # Badges, floating button, page processor
  core/             # Adapter registry, badge-display types
  popup/            # Extension popup UI
  shared/           # Messages, score colors, config
  vivino/           # Vivino API client + matcher
docs/
  vivino-api-notes.md
scripts/
  generate-icons.py
  zip-dist.mjs
  update.sh / update.ps1
tests/
e2e/
```

## Configuration

| Setting | Location | Notes |
|---------|----------|-------|
| GitHub repo (update banner) | `src/shared/config.ts` → `GITHUB_REPO` | `alanchanlp224/drink-good` |
| Vivino rate limit | `src/background/vivino-service.ts` | ~500ms between requests |
| Match thresholds | `src/vivino/matcher.ts` | Vintage 0.55, name-only 0.72 |

## Docs

- [Vivino API notes](docs/vivino-api-notes.md)
- [Release notes](./RELEASE_NOTES.md)
- Linear: [Drink Good project](https://linear.app/alan-chan/project/drink-good-f4c0d8c9e72c)
