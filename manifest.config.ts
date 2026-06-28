import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Drink Good",
  description: "Vivino wine scores overlaid on wine shop pages",
  version: "0.0.1",
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
  content_scripts: [
    {
      matches: ["*://wineview.com.hk/*", "*://www.wineview.com.hk/*"],
      js: ["src/content/main.ts"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "tabs"],
  host_permissions: [
    "https://www.vivino.com/*",
    "https://*.algolia.net/*",
    "https://api.github.com/*",
    "*://wineview.com.hk/*",
    "*://www.wineview.com.hk/*",
  ],
});
