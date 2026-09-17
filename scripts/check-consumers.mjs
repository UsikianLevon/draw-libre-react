import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TSC = join(ROOT, "node_modules", ".bin", "tsc");
const CONSUMER_DIR = join(ROOT, "test", "consumer");
const ENGINE_IMPORT =
  /(from|import)\s*\(?\s*["'](maplibre-gl|mapbox-gl|@maplibre\/maplibre-gl-style-spec)(\/[^"']*)?["']|reference\s+types\s*=\s*["'](maplibre-gl|mapbox-gl|@maplibre\/maplibre-gl-style-spec)["']/;

const CONSUMERS = [
  {
    name: "maplibre-gl 6.10.0, @types/react 19",
    packages: ["maplibre-gl@6.10.0", "@types/react@19.3.0"],
    files: ["consumer.tsx", "maplibre.tsx"],
  },
  {
    name: "maplibre-gl 5.24.0, @types/react 18",
    packages: ["maplibre-gl@5.24.0", "@types/react@18.3.31"],
    files: ["consumer.tsx", "maplibre.tsx"],
  },
  {
    name: "maplibre-gl 2.4.0, @types/react 16.14",
    packages: ["maplibre-gl@2.4.0", "@types/react@16.14.70"],
    files: ["consumer.tsx", "maplibre.tsx"],
  },
  {
    name: "mapbox-gl 3.30.0, @types/react 19",
    packages: ["mapbox-gl@3.30.0", "@types/react@19.3.0"],
    files: ["consumer.tsx", "mapbox.tsx"],
  },
];

const COMPILER_OPTIONS = {
  strict: true,
  noEmit: true,
  skipLibCheck: false,
  module: "esnext",
  moduleResolution: "bundler",
  target: "es2020",
  lib: ["DOM", "es2020"],
  jsx: "react-jsx",
  types: ["geojson"],
};

for (const file of ["dist/index.d.ts", "dist/index.js"]) {
  if (ENGINE_IMPORT.test(readFileSync(join(ROOT, file), "utf8"))) {
    console.log(`${file} imports an engine`);
    process.exit(1);
  }
}

const work = mkdtempSync(join(tmpdir(), "draw-libre-react-consumers-"));
const failed = [];

try {
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--json", "--pack-destination", work], {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, npm_config_dry_run: "" },
    }),
  );
  const tarball = join(work, packed[0].filename);
  const coreVersion = JSON.parse(
    readFileSync(join(ROOT, "node_modules", "draw-libre", "package.json"), "utf8"),
  ).version;

  for (const [index, consumer] of CONSUMERS.entries()) {
    const dir = join(work, `consumer-${index}`);
    mkdirSync(dir);
    for (const file of consumer.files) copyFileSync(join(CONSUMER_DIR, file), join(dir, file));
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: `consumer-${index}`, private: true, type: "module" }),
    );
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: COMPILER_OPTIONS, files: consumer.files }),
    );
    execFileSync(
      "npm",
      [
        "install",
        "--no-audit",
        "--no-fund",
        "--ignore-scripts",
        "--prefer-offline",
        "--no-package-lock",
        tarball,
        `draw-libre@${coreVersion}`,
        "@types/geojson@7946.0.16",
        ...consumer.packages,
      ],
      { cwd: dir, stdio: ["ignore", "ignore", "inherit"] },
    );
    try {
      execFileSync(TSC, ["-p", dir], { stdio: "inherit" });
      console.log(`types ok: ${consumer.name}`);
    } catch {
      failed.push(consumer.name);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failed.length > 0) {
  console.log(`types failed: ${failed.join(", ")}`);
  process.exit(1);
}
