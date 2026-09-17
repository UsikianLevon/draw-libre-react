import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// react dom 18 moved rendering to a separate client entry and 19 removed ReactDOM.render,
// so the test renderer is picked by the installed react dom major
const reactDom = JSON.parse(readFileSync(fromRoot("./node_modules/react-dom/package.json"), "utf8")) as {
  version: string;
};
const legacyReact = Number(reactDom.version.split(".")[0]) < 18;

export default defineConfig({
  resolve: {
    alias: {
      "#render": fromRoot(legacyReact ? "./test/support/render-legacy.ts" : "./test/support/render-root.ts"),
    },
  },
  // the dependency optimizer loses the maplibre gl 6 worker file
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  test: {
    include: ["test/**/*.test.tsx"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
