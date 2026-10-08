import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    entry: {
      index: "src/index.ts",
      "cli/index": "src/cli/index.ts",
      browser: "src/browser/index.ts",
      server: "src/server/index.ts",
      // Separate entry, so mediabunny (an optional peer) is only resolved when used.
      video: "src/browser/render-to-video.ts",
    },
    dts: {
      generator: "tsgo",
    },
    exports: {
      // The CLI is only meant to be run through `bin`; importing it would execute it.
      exclude: ["cli/index"],
      // main/types fallbacks for consumers on moduleResolution "node10".
      legacy: true,
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    printWidth: 80,
  },
});
