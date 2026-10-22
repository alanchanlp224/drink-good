# Drink Good v0.0.14

Chrome extension that overlays **Vivino scores and matched wine names** on supported wine shop product listings.

## Download

1. Open **[Releases](https://github.com/alanchanlp224/drink-good/releases)** on GitHub.
2. Click the **latest release** at the top (this release: **v0.0.14**).
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
| Lyndhurst Wine | [lyndhurstwine.com](https://lyndhurstwine.com/) |
| Wine Couple | [winecouple.hk](https://www.winecouple.hk/) |
| Ginsberg+Chan | [ginsbergchan.com](https://ginsbergchan.com/) |
| Cote d'Or Fine Wines | [cotedorfinewines.com](https://cotedorfinewines.com/) |
| VinoBuzz | [vinobuzz.ai](https://vinobuzz.ai/marketplace) |

Visit a supported shop, click the **burgundy wine-glass button** (bottom-right), and Vivino badges appear on product cards. Click the score or wine name to open the Vivino match. The black glass icon on a matched badge opens Hong Kong prices for that wine on Wine-Searcher.

## What's new in v0.0.14

### Wine-Searcher prices
- Matched badges include a black wine-glass icon. It opens a Hong Kong Wine-Searcher search for the Vivino wine name and vintage. The score and name still open Vivino.

### VinoBuzz support
- New retailer adapter for [vinobuzz.ai/marketplace](https://vinobuzz.ai/marketplace) (masonry wine cards and product pages).

### Shops added since v0.0.8
- Wine Couple, Ginsberg+Chan, and Cote d'Or Fine Wines.
- Cote d'Or case sizes such as `6x75cl` are removed before Vivino search so the match uses the wine name and vintage.

## Upgrading from an earlier release

If you already have Drink Good loaded:

1. Open the popup → **Update now** (after this release is published), **or**
2. Replace the folder you used for **Load unpacked**, then click **Reload** on `chrome://extensions`:

- **macOS:** `./scripts/update.sh "$HOME/Extensions/drink-good"`
- **Windows:** `.\scripts\update.ps1 "C:\Extensions\drink-good"`

Or download `drink-good.zip` again and overwrite the same folder manually.

## Full changelog

https://github.com/alanchanlp224/drink-good/compare/v0.0.8...v0.0.14
