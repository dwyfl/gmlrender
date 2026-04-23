#!/usr/bin/env node
/**
 * Fixes a packaging bug in wasm-webp@0.1.0:
 * The package has "type":"module" but its dist/cjs/ folder contains CommonJS
 * files. Without a local package.json override, Node v22+ (which can now
 * require() ESM) executes those CJS files as ES modules, causing
 * "exports is not defined in ES module scope".
 *
 * We add dist/cjs/package.json with {"type":"commonjs"} so Node treats that
 * directory correctly regardless of the parent package's "type" field.
 */
import { writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

let pkgJsonPath;
try {
  pkgJsonPath = require.resolve("wasm-webp/package.json");
} catch {
  // wasm-webp not installed — nothing to do.
  process.exit(0);
}

const cjsPkgPath = join(dirname(pkgJsonPath), "dist", "cjs", "package.json");
if (!existsSync(cjsPkgPath)) {
  writeFileSync(cjsPkgPath, '{ "type": "commonjs" }\n');
}
