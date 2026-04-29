import { describe, test, expect } from "vite-plus/test";
import { createGMLView, createGMLImage } from "../src/server/index.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { decodeAnimation } from "wasm-webp";
import { PNG } from "pngjs";
import { pixelReaderfromDataURL, isDark, isWhite } from "./helpers/pixels.ts";
import { matchImageSnapshot } from "./helpers/snapshots.ts";
import { renderToWebp } from "../src/render/video.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const example000 = readFileSync(join(__dirname, "./data/example000.xml"), "utf8");
const example001 = readFileSync(join(__dirname, "./data/example001.xml"), "utf8");

// ---------------------------------------------------------------------------
// Approach 1: pixel property assertions
// ---------------------------------------------------------------------------
describe("Preview: pixel properties", () => {
  test("background is white by default", async () => {
    const pixels = await pixelReaderfromDataURL(
      await createGMLImage(example001, "node-canvas", 320, 240, {
        format: "png",
      }),
    );
    expect(isWhite(pixels.at(5, 5))).toBe(true);
    expect(isWhite(pixels.at(5, 235))).toBe(true);
    expect(isWhite(pixels.at(315, 5))).toBe(true);
    expect(isWhite(pixels.at(315, 235))).toBe(true);
  });

  test("custom background color is applied", async () => {
    const pixels = await pixelReaderfromDataURL(
      await createGMLImage(example001, "node-canvas", 320, 240, {
        background: "#ff0000",
        format: "png",
      }),
    );
    const corner = pixels.at(5, 5);
    expect(corner.r).toBeGreaterThan(200);
    expect(corner.g).toBeLessThan(50);
    expect(corner.b).toBeLessThan(50);
  });

  test("renders visible strokes for multi-point GML", async () => {
    const pixels = await pixelReaderfromDataURL(
      await createGMLImage(example001, "node-canvas", 320, 240, {
        format: "png",
      }),
    );
    expect(pixels.count(isDark)).toBeGreaterThan(100);
  });

  test("different GML inputs produce different images", async () => {
    const a = await createGMLImage(example000, "node-canvas", 320, 240, {
      format: "png",
    });
    const b = await createGMLImage(example001, "node-canvas", 320, 240, {
      format: "png",
    });
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// Approach 2: image file snapshots
// ---------------------------------------------------------------------------
describe("Preview: image snapshots", () => {
  test("renders an empty document", async () => {
    const result = await matchImageSnapshot(
      await createGMLImage(example000, "node-canvas", 320, 240, {
        format: "png",
      }),
      join(__dirname, "snapshots/empty-document.png"),
    );
    if (result) {
      expect(result.mismatchedPixels, `${result.mismatchedPixels} pixels differ`).toBe(0);
    }
  });

  test("renders a basic tag", async () => {
    const result = await matchImageSnapshot(
      await createGMLImage(example001, "node-canvas", 320, 240, {
        format: "png",
      }),
      join(__dirname, "snapshots/basic-tag.png"),
    );
    if (result) {
      expect(result.mismatchedPixels, `${result.mismatchedPixels} pixels differ`).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// renderToVideo — actual WebP encoding via wasm-webp
//
// Use small dimensions and low fps to keep tests fast. example001.xml has a
// totalTime of ~5.9 s; at 5 fps that's 30 frames.
// ---------------------------------------------------------------------------

// Last frame t=5.898998 in example001.xml
const EXAMPLE001_TOTAL_TIME = 5.898998;

function isValidWebP(data: Uint8Array): boolean {
  // WebP files start with RIFF....WEBP
  const str = (off: number) => String.fromCharCode(...data.slice(off, off + 4));
  return data.length > 12 && str(0) === "RIFF" && str(8) === "WEBP";
}

describe("renderToVideo", () => {
  test("returns valid animated WebP bytes", async () => {
    const result = await renderToWebp(createGMLView(example001, "node-canvas", 160, 120), {
      fps: 5,
    });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(isValidWebP(result)).toBe(true);
  });

  test("frame count matches fps × animation duration", async () => {
    const fps = 5;
    const result = await renderToWebp(createGMLView(example001, "node-canvas", 160, 120), {
      fps,
    });

    const frames = await decodeAnimation(result, true);
    expect(frames).toHaveLength(Math.ceil(EXAMPLE001_TOTAL_TIME * fps));
  });

  test("frame duration matches 1000 / fps", async () => {
    const fps = 5;
    const result = await renderToWebp(createGMLView(example001, "node-canvas", 160, 120), {
      fps,
    });

    const frames = await decodeAnimation(result, true);
    expect(frames![0].duration).toBe(Math.round(1000 / fps)); // 200 ms
  });

  test("last frame matches the fully-drawn animation snapshot", async () => {
    const result = await renderToWebp(createGMLView(example001, "node-canvas", 320, 240), {
      fps: 30,
    });

    const frames = await decodeAnimation(result, true);
    const lastFrame = frames![frames!.length - 1];

    const png = new PNG({ width: lastFrame.width, height: lastFrame.height });
    png.data = Buffer.from(lastFrame.data);
    const blob = new Blob([new Uint8Array(PNG.sync.write(png))], {
      type: "image/png",
    });

    const comparison = await matchImageSnapshot(blob, join(__dirname, "snapshots/basic-tag.png"));
    if (comparison) {
      expect(comparison.mismatchedPixels, `${comparison.mismatchedPixels} pixels differ`).toBe(0);
    }
  });

  test("lossless encoding produces different output than lossy", async () => {
    const [lossy, lossless] = await Promise.all([
      renderToWebp(createGMLView(example001, "node-canvas", 160, 120), {
        fps: 3,
        lossless: false,
      }),
      renderToWebp(createGMLView(example001, "node-canvas", 160, 120), {
        fps: 3,
        lossless: true,
      }),
    ]);
    // Lossless WebP is always bit-for-bit distinct from lossy
    expect(Buffer.from(lossless)).not.toEqual(Buffer.from(lossy));
  });
});
