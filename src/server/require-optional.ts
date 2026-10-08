import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * Loads an optional peer dependency on first use, with an actionable error when it is
 * missing (or its native binary was not built). Synchronous, so render contexts can be
 * created without async factories; the backends are CommonJS packages.
 */
export function requireOptional<T>(name: string, feature: string): T {
  try {
    return require(name);
  } catch (error) {
    throw new Error(
      `${feature} requires the optional "${name}" package. Install it with ` +
        `\`npm install ${name}\` (pnpm 10+ also needs its install script approved: ` +
        `\`pnpm approve-builds\`).`,
      { cause: error },
    );
  }
}
