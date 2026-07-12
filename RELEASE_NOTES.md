# Drink Good v0.0.4

Chrome extension that overlays **Vivino scores and matched wine names** on supported wine shop product listings.

## Download

1. Open **[Releases](https://github.com/alanchanlp224/drink-good/releases)** on GitHub.
2. Click the **latest release** at the top (this release: **v0.0.4**).
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

## What's new in v0.0.4

### New retailers
- **XtraWine** — Shopify + Algolia product grid; badge opens Vivino without following the product link.
- **King's Wine Cellar** — Shopify collection grid and product pages.

### Fixes & improvements
- **Floating trigger** on King's Wine stacks above the Smile.io Rewards button with a clear gap.
- **Update banner** no longer shows when you are already on the latest release.
- Badge click handling improved on overlay-heavy product cards (XtraWine).

## Upgrading from an earlier release

Replace the folder you used for **Load unpacked**, then click **Reload** on `chrome://extensions`:

- **macOS:** `./scripts/update.sh "$HOME/Extensions/drink-good"`
- **Windows:** `.\scripts\update.ps1 "C:\Extensions\drink-good"`

Or download `drink-good.zip` again and overwrite the same folder manually.

## Full changelog

https://github.com/alanchanlp224/drink-good/compare/v0.0.3...v0.0.4
