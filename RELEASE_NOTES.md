# Drink Good v0.0.6

Chrome extension that overlays **Vivino scores and matched wine names** on supported wine shop product listings.

## Download

1. Open **[Releases](https://github.com/alanchanlp224/drink-good/releases)** on GitHub.
2. Click the **latest release** at the top (this release: **v0.0.6**).
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

## What's new in v0.0.6

### Champagne style matching
- **Keeps Blanc de Blancs / Blanc de Noirs** as identity — no longer strips them during name matching (fixes under-specified titles collapsing to popular sibling cuvées).
- **Expands abbreviations** — `BdB` → Blanc de Blancs, `BdN` → Blanc de Noirs, `Grd` → grand; singular Blanc de Blanc(s) normalized.
- **Style coverage preference** — candidates missing the shop’s BdB/BdN phrase are penalized and lose tie-breaks.
- **Dosage still stripped** — brut nature / extra brut / demi-sec remain garnish for search and scoring.
- **Plot + style token protection** — Clos plot names and blanc tokens stay distinctive in Algolia distillation.
- **Saint / 1er synonyms** — `st`/`ste` → saint, `1er` → premier (e.g. Clos St Jean).
- **Cascade trimmed** — Algolia cascade is full title + distilled only; cache version bumped.

### Examples fixed in this release
- Nicolas Feuillatte Blanc de Blancs 2019 (stays in BdB family — not Palmes d’Or)
- Pol Roger Blanc de Blancs 2016
- Jean-Claude Ramonet Clos St Jean (vs Clos du Cailleret)
- Jacques Lassaigne Le Cotet NV / Magnum
- Benoit Dehu Initiation Brut Nature NV

## Upgrading from an earlier release

Replace the folder you used for **Load unpacked**, then click **Reload** on `chrome://extensions`:

- **macOS:** `./scripts/update.sh "$HOME/Extensions/drink-good"`
- **Windows:** `.\scripts\update.ps1 "C:\Extensions\drink-good"`

Or download `drink-good.zip` again and overwrite the same folder manually.

## Full changelog

https://github.com/alanchanlp224/drink-good/compare/v0.0.5...v0.0.6
