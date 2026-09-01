# Drink Good v0.0.8

Chrome extension that overlays **Vivino scores and matched wine names** on supported wine shop product listings.

## Download

1. Open **[Releases](https://github.com/alanchanlp224/drink-good/releases)** on GitHub.
2. Click the **latest release** at the top (this release: **v0.0.8**).
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

Visit a supported shop, click the **burgundy wine-glass button** (bottom-right), and Vivino badges appear on product cards.

## What's new in v0.0.8

### Lyndhurst Wine support
- New retailer adapter for [lyndhurstwine.com](https://lyndhurstwine.com/) (Shopify product-card grid + PDP).
- Badge placement fixed for Lyndhurst’s nested price/hover layout — badges render under the visible product title instead of failing silently.

## Upgrading from an earlier release

If you already have Drink Good loaded:

1. Open the popup → **Update now** (after this release is published), **or**
2. Replace the folder you used for **Load unpacked**, then click **Reload** on `chrome://extensions`:

- **macOS:** `./scripts/update.sh "$HOME/Extensions/drink-good"`
- **Windows:** `.\scripts\update.ps1 "C:\Extensions\drink-good"`

Or download `drink-good.zip` again and overwrite the same folder manually.

## Full changelog

https://github.com/alanchanlp224/drink-good/compare/v0.0.7...v0.0.8
