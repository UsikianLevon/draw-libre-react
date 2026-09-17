import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: "esm",
  dts: { sourcemap: true },
  sourcemap: true,
  platform: "neutral",
});
