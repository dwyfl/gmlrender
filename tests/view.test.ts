import { describe, test, expect } from "vite-plus/test";
import { GMLViewStatic } from "../src/view-static.ts";
import { GML } from "gmljs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pixelReaderfromDataURL, isDark, isWhite } from "./helpers/pixels.ts";
import { matchImageSnapshot } from "./helpers/snapshots.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const example000 = readFileSync(join(__dirname, "./data/example000.xml"), "utf8");
const example001 = readFileSync(join(__dirname, "./data/example001.xml"), "utf8");

// ---------------------------------------------------------------------------
// Approach 1: pixel property assertions
// These tests describe what the image should look like without locking in the
// exact pixel data. They survive minor rendering changes and catch regressions
// that matter (wrong background color, invisible strokes, etc.).
// ---------------------------------------------------------------------------
describe("Preview: pixel properties", () => {
  test("background is white by default", async () => {
    const pixels = await pixelReaderfromDataURL(
      await new GMLViewStatic(new GML(example001), {
        width: 320,
        height: 240,
      }).render("png"),
    );
    // Sample the four corners — they should never be touched by the stroke
    expect(isWhite(pixels.at(5, 5))).toBe(true);
    expect(isWhite(pixels.at(5, 235))).toBe(true);
    expect(isWhite(pixels.at(315, 5))).toBe(true);
    expect(isWhite(pixels.at(315, 235))).toBe(true);
  });

  test("custom background color is applied", async () => {
    const pixels = await pixelReaderfromDataURL(
      await new GMLViewStatic(new GML(example001), {
        width: 320,
        height: 240,
        background: "#ff0000",
      }).render("png"),
    );
    const corner = pixels.at(5, 5);
    expect(corner.r).toBeGreaterThan(200);
    expect(corner.g).toBeLessThan(50);
    expect(corner.b).toBeLessThan(50);
  });

  test("renders visible strokes for multi-point GML", async () => {
    const pixels = await pixelReaderfromDataURL(
      await new GMLViewStatic(new GML(example001), {
        width: 320,
        height: 240,
      }).render("png"),
    );
    expect(pixels.count(isDark)).toBeGreaterThan(100);
  });

  test("different GML inputs produce different images", async () => {
    const a = await new GMLViewStatic(new GML(example000), {
      width: 320,
      height: 240,
    }).render("png");
    const b = await new GMLViewStatic(new GML(example001), {
      width: 320,
      height: 240,
    }).render("png");
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// Approach 2: image file snapshots
// Reference PNGs are stored in tests/snapshots/ and tracked in git so they
// can be visually reviewed. On the first run (no reference file), the rendered
// image is saved as the new reference and the test passes. On subsequent runs,
// pixelmatch compares pixel-by-pixel against the reference.
//
// To update a reference: delete the PNG file and re-run the tests.
// ---------------------------------------------------------------------------
describe("Preview: image snapshots", () => {
  test("renders an empty document", async () => {
    const result = await matchImageSnapshot(
      await new GMLViewStatic(new GML(example000), {
        width: 320,
        height: 240,
      }).render("png"),
      join(__dirname, "snapshots/empty-document.png"),
    );
    if (result) {
      expect(result.mismatchedPixels, `${result.mismatchedPixels} pixels differ`).toBe(0);
    }
  });

  test("renders a basic tag", async () => {
    const result = await matchImageSnapshot(
      await new GMLViewStatic(new GML(example001), {
        width: 320,
        height: 240,
      }).render("png"),
      join(__dirname, "snapshots/basic-tag.png"),
    );
    if (result) {
      expect(result.mismatchedPixels, `${result.mismatchedPixels} pixels differ`).toBe(0);
    }
  });
});
