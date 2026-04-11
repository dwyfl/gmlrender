import { describe, test, expect, beforeEach, afterEach } from "vite-plus/test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI = join(__dirname, "../src/cli/index.ts");
const EXAMPLE = join(__dirname, "data/example001.xml");
const EXAMPLE_XML = readFileSync(EXAMPLE, "utf8");

function run(args: string[]) {
  return spawnSync("node", ["--experimental-strip-types", CLI, ...args], {
    encoding: "utf8",
    env: process.env,
  });
}

describe("CLI", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "gmlrender-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("writes a PNG to the specified output path", () => {
    const out = join(tmpDir, "out.png");
    const result = run([EXAMPLE, out]);
    expect(result.status).toBe(0);
    expect(existsSync(out)).toBe(true);
  });

  test("derives the output path from the input filename (.xml → .png)", () => {
    const input = join(tmpDir, "tag.xml");
    writeFileSync(input, EXAMPLE_XML);
    const result = run([input]);
    expect(result.status).toBe(0);
    expect(existsSync(join(tmpDir, "tag.png"))).toBe(true);
  });

  test("derives the output path for a .gml extension", () => {
    const input = join(tmpDir, "tag.gml");
    writeFileSync(input, EXAMPLE_XML);
    const result = run([input]);
    expect(result.status).toBe(0);
    expect(existsSync(join(tmpDir, "tag.png"))).toBe(true);
  });

  test("respects --format jpg", () => {
    const out = join(tmpDir, "out.jpg");
    const result = run([EXAMPLE, out, "--format", "jpg"]);
    expect(result.status).toBe(0);
    expect(existsSync(out)).toBe(true);
  });

  test("writes an image with the specified --width and --height", () => {
    const out = join(tmpDir, "out.png");
    run([EXAMPLE, out, "--width", "100", "--height", "80"]);
    const png = PNG.sync.read(readFileSync(out));
    expect(png.width).toBe(100);
    expect(png.height).toBe(80);
  });

  test("applies --background to corner pixels", () => {
    const out = join(tmpDir, "out.png");
    run([EXAMPLE, out, "--background", "#ff0000"]);
    const png = PNG.sync.read(readFileSync(out));
    expect(png.data[0]).toBeGreaterThan(200); // r
    expect(png.data[1]).toBeLessThan(50); //     g
    expect(png.data[2]).toBeLessThan(50); //     b
  });

  test("exits with non-zero when the input file does not exist", () => {
    const result = run([join(tmpDir, "no-such-file.xml"), join(tmpDir, "out.png")]);
    expect(result.status).not.toBe(0);
  });
});
