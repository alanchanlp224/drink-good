import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "Drink Good",
  description: "Vivino wine scores overlaid on wine shop pages",
  version: packageJson.version,
  icons: {
    "16": "public/icon-16.png",
    "48": "public/icon-48.png",
    "128": "public/icon-128.png",
  },
  action: {
    default_title: "Drink Good",
    default_popup: "src/popup/popup.html",
  },
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  // Single entry for all retailers sharing main.ts — CRXJS emits one
  // web_accessible_resources block; separate entries only expose WAR for the last match.
  content_scripts: [
    {
      matches: [
        "*://wineview.com.hk/*",
        "*://www.wineview.com.hk/*",
        "*://markets.cruworldwine.com/*",
        "*://watsonswine.com/*",
        "*://www.watsonswine.com/*",
        "*://rngwine.com/*",
        "*://www.rngwine.com/*",
        "*://remfly.com.hk/*",
        "*://www.remfly.com.hk/*",
        "*://tencellars.hk/*",
        "*://www.tencellars.hk/*",
        "*://xtrawine.com/*",
        "*://www.xtrawine.com/*",
        "*://kingswine.hk/*",
        "*://www.kingswine.hk/*",
      ],
      js: ["src/content/main.ts"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "tabs"],
  host_permissions: [
    "https://www.vivino.com/*",
    "https://*.algolia.net/*",
    "https://api.github.com/*",
    "https://github.com/*",
    "https://objects.githubusercontent.com/*",
    "*://wineview.com.hk/*",
    "*://www.wineview.com.hk/*",
    "*://markets.cruworldwine.com/*",
    "*://watsonswine.com/*",
    "*://www.watsonswine.com/*",
    "*://rngwine.com/*",
    "*://www.rngwine.com/*",
    "*://remfly.com.hk/*",
    "*://www.remfly.com.hk/*",
    "*://tencellars.hk/*",
    "*://www.tencellars.hk/*",
    "*://xtrawine.com/*",
    "*://www.xtrawine.com/*",
    "*://kingswine.hk/*",
    "*://www.kingswine.hk/*",
  ],
});
