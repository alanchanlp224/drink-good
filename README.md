# Drink Good

Chrome extension (MV3) that overlays **Vivino scores and matched wine names** on wine retailer product listings.

**MVP retailer:** [Wineview HK](https://wineview.com.hk/) (`wineview.com.hk/*`)

## Development

```bash
npm install
npm run build           # production build → dist/
npm run dev             # watch mode for extension development
npm test                # unit tests (31 tests)
npm run test:e2e        # Playwright E2E — extension + Wineview first wine (live Vivino)
npm run test:vivino:live  # live Vivino API smoke test
```

## Load unpacked (Chrome)

### From source (developers)

1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. **Load unpacked** → select the `dist/` folder
5. Visit [Wineview red wine](https://wineview.com.hk/product-category/wine-shop/red-wine/)
6. Click the **burgundy wine-glass button** (bottom-right) to start Vivino lookups
7. Click again to stop; badges appear on each product card
8. Open the extension **popup** → **Debug** for log download / cache clear

After code changes, rebuild and click **Reload** on `chrome://extensions`.

### From GitHub release (no Node required)

1. Download `drink-good.zip` from the [latest release](https://github.com/alanchanlp224/drink-good/releases/latest)
2. Unzip to a permanent folder (e.g. `~/Extensions/drink-good` on Mac, `C:\Extensions\drink-good` on Windows)
3. Open `chrome://extensions` → **Developer mode** → **Load unpacked** → select that folder

## Updating the extension

When a new version is published, the extension **popup** shows an **Update available** banner linking to the release.

### macOS

```bash
chmod +x scripts/update.sh
./scripts/update.sh "$HOME/Extensions/drink-good"
```

Replace the path with the folder you used for **Load unpacked**.

### Windows (PowerShell)

```powershell
.\scripts\update.ps1 "C:\Extensions\drink-good"
```

Then open `chrome://extensions` and click **Reload** on Drink Good.

### Publishing a release (maintainers)

```bash
git tag v0.0.2
git push origin v0.0.2
```

GitHub Actions builds `drink-good.zip` and attaches it to the release. Local packaging: `npm run package`.

## E2E tests (Playwright)

```bash
npm run test:e2e
```

Loads the built extension in Chromium, opens the [Wineview red wine listing](https://wineview.com.hk/product-category/wine-shop/red-wine/), starts the floating trigger, waits for the **first** product badge (live Vivino lookup), then stops. Asserts a score badge (`excellent` / `fair` / `low`) or grey `unknown` badge.

Requires network access to Wineview and Vivino. Runs serially with a 90s lookup timeout. The test sets `data-drink-good-max-products="1"` on the page so only the first listing is processed.

## How it works

1. **Floating trigger** — Burgundy glass FAB on supported retailer pages only
2. **Extract** — Retailer adapter reads product titles from the DOM
3. **Match** — Service worker queries Vivino (Algolia + Explore fallback), applies name/vintage matching
4. **Badge** — Shadow DOM badge per product: `★ 4.3 (713) — Château Lynch-Bages Pauillac (Grand Cru Classé) 2019`
5. **Popup** — Version, adapter, cache size, processing status; debug tools for logs

## Badge behavior

| Aspect | Wineview (MVP) |
|--------|----------------|
| **Placement** | After product title, before price (inside product link container) |
| **Content** | Gold star + Vivino score + review count + full matched Vivino name |
| **Colors** | Score-based tint (green >4.0, amber 3.5–4.0, red <3.5, grey no match) — matches Testing project palette |
| **No match** | Grey `?` badge with reason in tooltip |
| **Click** | Opens Vivino wine page (stops propagation so product link is not followed) |

Per-retailer placement and styling is configured via `BadgeAdapter` on each `RetailerAdapter` (see `src/adapters/wineview-badge.ts`).

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
  adapters/         # Wineview DOM extraction
  content/          # Badge render + placement
  core/             # Badge display helpers
  vivino/           # Matcher unit tests
  background/       # Vivino service tests
e2e/
  fixtures.ts       # Extension-loaded browser context
  wineview-first-wine.spec.ts
```

## Configuration

| Setting | Location | Notes |
|---------|----------|-------|
| GitHub repo (update banner) | `src/shared/config.ts` → `GITHUB_REPO` | `alanchanlp224/drink-good` |
| Vivino rate limit | `src/background/vivino-service.ts` | ~500ms between requests |
| Match thresholds | `src/vivino/matcher.ts` | Vintage 0.55, name-only 0.72 |

## Docs

- [Vivino API notes](docs/vivino-api-notes.md)
- Linear: [ADR-001 Per-retailer badge display](https://linear.app/alan-chan/document/adr-001-per-retailer-badge-display-533d890a690e)
- Linear project: [Drink Good](https://linear.app/alan-chan/project/drink-good-f4c0d8c9e72c)
- PRD: [[PRD] Drink Good](https://linear.app/alan-chan/document/prd-drink-good-9e1cba16e21e)

## Roadmap (Linear)

| Issue | Status | Description |
|-------|--------|-------------|
| ALA-76 | [Done](https://linear.app/alan-chan/issue/ALA-76/add-live-e2e-test-for-wineview-first-wine-only) | Playwright E2E — first wine on Wineview |
| ALA-77 | [Done](https://linear.app/alan-chan/issue/ALA-77/github-releases-pipeline-and-update-scripts) | GitHub Releases + update scripts |
| ALA-78 | Backlog (Beta) | Cru World Wine Markets adapter |
| ALA-79 | [Done](https://linear.app/alan-chan/issue/ALA-79/badge-ui-polish-and-per-site-display-config) | Badge UI polish + per-site display (manual QA passed) |
