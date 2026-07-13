# Drink Good v0.0.5

Chrome extension that overlays **Vivino scores and matched wine names** on supported wine shop product listings.

## Download

1. Open **[Releases](https://github.com/alanchanlp224/drink-good/releases)** on GitHub.
2. Click the **latest release** at the top (this release: **v0.0.5**).
3. Scroll to **Assets**.
4. Click **`drink-good.zip`** to download.
5. Follow the [installation guide in README](https://github.com/alanchanlp224/drink-good#install-drink-good-chrome) (macOS and Windows).

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

Visit a supported shop, click the **burgundy wine-glass button** (bottom-right), and Vivino badges appear on product cards.

## What's new in v0.0.5

### Vivino matching (major)
- **Composite name scoring** with tie-breakers — fewer wrong cuvée picks (e.g. Les Quartz vs generic Châteauneuf).
- **Apostrophe normalization** — Wineview curly apostrophes (`d'Armailhac`) match correctly.
- **Condition notes stripped** — `(damage label)` and similar shop notes no longer block matches.
- **All-vintage score fallback** — when a young vintage has no published average, shows wine-wide score with **(All Vintage)** in the badge.
- **NV / champagne fixes** — U.V. wines no longer dropped from Algolia; distilled search queries and multi-step Algolia cascade; style tokens (`brut nature`, `blanc de blancs`) and bottle sizes (`Magnum 1.5L`) stripped for search and scoring.
- **Re-run refreshes badges** — starting a new run clears stale badges and Vivino session cache.

### Examples fixed in this release
- d'Armailhac 1993, Lafon Rochet 1989 (damage label), d'Aiguilhe 2014
- La Chapelle de La Mission Haut-Brion 2023 (all-vintage 4.2)
- Jacques Lassaigne Le Cotet NV (incl. Magnum)
- Benoit Dehu Initiation Brut Nature NV

## Upgrading from an earlier release

Replace the folder you used for **Load unpacked**, then click **Reload** on `chrome://extensions`:

- **macOS:** `./scripts/update.sh "$HOME/Extensions/drink-good"`
- **Windows:** `.\scripts\update.ps1 "C:\Extensions\drink-good"`

Or download `drink-good.zip` again and overwrite the same folder manually.

## Full changelog

https://github.com/alanchanlp224/drink-good/compare/v0.0.4...v0.0.5
