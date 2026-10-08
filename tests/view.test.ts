import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vite-plus/test";
import { createGMLView, createGMLImage } from "../src/server/index.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pixelReaderfromDataURL, isDark, isWhite } from "./helpers/pixels.ts";
import { matchImageSnapshot } from "./helpers/snapshots.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const example000 = readFileSync(
  join(__dirname, "./data/example000.xml"),
  "utf8",
);
const example001 = readFileSync(
  join(__dirname, "./data/example001.xml"),
  "utf8",
);
const exampleBrush = readFileSync(
  join(__dirname, "./data/example-brush.xml"),
  "utf8",
);

const size = {
  type: "node-canvas",
  width: 320,
  height: 240,
  format: "png",
} as const;

const isRed = (px: { r: number; g: number; b: number; a: number }) =>
  px.r > 200 && px.g < 60 && px.b < 60 && px.a > 200;

// ---------------------------------------------------------------------------
// Approach 1: pixel property assertions
// ---------------------------------------------------------------------------
describe("Preview: pixel properties", () => {
  test("background is white by default", async () => {
    const pixels = await pixelReaderfromDataURL(
      await createGMLImage(example001, {
        type: "node-canvas",
        width: 320,
        height: 240,
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
      await createGMLImage(example001, {
        type: "node-canvas",
        width: 320,
        height: 240,
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
      await createGMLImage(example001, {
        type: "node-canvas",
        width: 320,
        height: 240,
        format: "png",
      }),
    );
    expect(pixels.count(isDark)).toBeGreaterThan(100);
  });

  test("different GML inputs produce different images", async () => {
    const a = await createGMLImage(example000, {
      type: "node-canvas",
      width: 320,
      height: 240,
      format: "png",
    });
    const b = await createGMLImage(example001, {
      type: "node-canvas",
      width: 320,
      height: 240,
      format: "png",
    });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Approach 2: image file snapshots
// ---------------------------------------------------------------------------
describe("Preview: image snapshots", () => {
  test("renders an empty document", async () => {
    const result = await matchImageSnapshot(
      await createGMLImage(example000, {
        type: "node-canvas",
        width: 320,
        height: 240,
        format: "png",
      }),
      join(__dirname, "snapshots/empty-document.png"),
    );
    if (result) {
      expect(
        result.mismatchedPixels,
        `${result.mismatchedPixels} pixels differ`,
      ).toBe(0);
    }
  });

  test("renders a basic tag", async () => {
    const result = await matchImageSnapshot(
      await createGMLImage(example001, {
        type: "node-canvas",
        width: 320,
        height: 240,
        format: "png",
      }),
      join(__dirname, "snapshots/basic-tag.png"),
    );
    if (result) {
      expect(
        result.mismatchedPixels,
        `${result.mismatchedPixels} pixels differ`,
      ).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// createGMLImage options
// ---------------------------------------------------------------------------
describe("createGMLImage options", () => {
  test("color is applied to the strokes", async () => {
    const pixels = await pixelReaderfromDataURL(
      await createGMLImage(example001, { ...size, color: "#ff0000" }),
    );
    expect(pixels.count(isRed)).toBeGreaterThan(100);
    expect(pixels.count(isDark)).toBe(0);
  });

  test("brushSizeMultiplier scales the default line width", async () => {
    const [normal, thick] = await Promise.all([
      createGMLImage(example001, size).then(pixelReaderfromDataURL),
      createGMLImage(example001, { ...size, brushSizeMultiplier: 3 }).then(
        pixelReaderfromDataURL,
      ),
    ]);
    expect(thick.count(isDark)).toBeGreaterThan(normal.count(isDark) * 2);
  });

  test("brushSizeMultiplier scales brush widths from the document", async () => {
    const [normal, thick] = await Promise.all([
      createGMLImage(exampleBrush, size).then(pixelReaderfromDataURL),
      createGMLImage(exampleBrush, { ...size, brushSizeMultiplier: 3 }).then(
        pixelReaderfromDataURL,
      ),
    ]);
    expect(thick.count(isDark)).toBeGreaterThan(normal.count(isDark) * 2);
  });

  test("position 1 draws every stroke of a document without timestamps", async () => {
    // Two strokes on opposite sides of the canvas, no <t> elements.
    const gml = `<gml><tag><drawing>
      <stroke><pt><x>0.1</x><y>0.1</y></pt><pt><x>0.4</x><y>0.1</y></pt><pt><x>0.4</x><y>0.4</y></pt></stroke>
      <stroke><pt><x>0.6</x><y>0.6</y></pt><pt><x>0.9</x><y>0.9</y></pt></stroke>
    </drawing></tag></gml>`;
    const pixels = await pixelReaderfromDataURL(
      await createGMLImage(gml, size),
    );
    let darkInLowerRight = 0;
    for (let y = 150; y < 240; y++) {
      for (let x = 200; x < 320; x++) {
        if (isDark(pixels.at(x, y))) darkInLowerRight++;
      }
    }
    expect(darkInLowerRight).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Degenerate documents
// ---------------------------------------------------------------------------
describe("Degenerate documents", () => {
  test("a document without any <tag> renders without throwing", async () => {
    await expect(createGMLImage("<gml></gml>", size)).resolves.toBeInstanceOf(
      ArrayBuffer,
    );
  });

  test("a zero-duration document has finite time and position", () => {
    const view = createGMLView(
      "<gml><tag><drawing><stroke><pt><x>0.5</x><y>0.5</y><t>0</t></pt></stroke></drawing></tag></gml>",
      size,
    );
    view.setTime(1);
    expect(view.currentTime).toBe(0);
    expect(view.currentPosition).toBe(0);
    view.setPosition(0.5);
    expect(view.currentPosition).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Playback lifecycle (fake timers drive the Node.js frame fallback)
// ---------------------------------------------------------------------------
const SHORT_GML =
  "<gml><tag><drawing><stroke><pt><x>0.1</x><y>0.1</y><t>0</t></pt><pt><x>0.9</x><y>0.9</y><t>0.1</t></pt></stroke></drawing></tag></gml>";

function createCountingView(gml = SHORT_GML) {
  const view = createGMLView(gml, size);
  const draw = view.draw.bind(view);
  const counter = { draws: 0 };
  view.draw = () => {
    counter.draws++;
    draw();
  };
  const events: string[] = [];
  for (const type of ["start", "stop", "restart"] as const) {
    view.addEventListener(type, () => events.push(type));
  }
  return { view, counter, events };
}

describe("Playback lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "performance", "Date"],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("playback runs a single frame loop", () => {
    const { view } = createCountingView();
    view.start();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(500);
    expect(vi.getTimerCount()).toBe(1);
    view.stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("calling start() twice does not leak a draw loop", () => {
    const { view, counter } = createCountingView();
    view.start();
    view.start();
    vi.advanceTimersByTime(50);
    view.stop();
    const drawsAtStop = counter.draws;
    vi.advanceTimersByTime(500);
    expect(counter.draws).toBe(drawsAtStop);
    view.unload();
  });

  test("setLoop(false) stops at the end and draws the final frame", () => {
    const { view, counter, events } = createCountingView();
    view.setLoop(false);
    view.start();
    vi.advanceTimersByTime(2000);
    expect(events).toEqual(["start", "stop"]);
    expect(view.isPlaying).toBe(false);
    expect(view.state.frameIndex).toBe(view.state.totalFrames - 1);
    const drawsAtEnd = counter.draws;
    vi.advanceTimersByTime(500);
    expect(counter.draws).toBe(drawsAtEnd);
  });

  test("looping playback restarts after reaching the end", () => {
    const { view, events } = createCountingView();
    view.start();
    vi.advanceTimersByTime(2000);
    expect(events).toContain("restart");
    expect(view.isPlaying).toBe(true);
    view.unload();
  });

  test("restart() while stopped starts drawing", () => {
    const { view, counter } = createCountingView();
    view.restart();
    vi.advanceTimersByTime(100);
    expect(view.isPlaying).toBe(true);
    expect(counter.draws).toBeGreaterThan(0);
    view.unload();
  });

  test("unload() stops playback", () => {
    const { view, counter } = createCountingView();
    view.start();
    view.unload();
    expect(view.isPlaying).toBe(false);
    vi.advanceTimersByTime(500);
    expect(counter.draws).toBe(0);
  });

  test("setGml() during playback keeps playing the new document with a single loop", () => {
    const { view, counter } = createCountingView();
    view.start();
    vi.advanceTimersByTime(50);
    view.setGml(example001);
    expect(view.isPlaying).toBe(true);
    vi.advanceTimersByTime(50);
    view.stop();
    const drawsAtStop = counter.draws;
    vi.advanceTimersByTime(500);
    expect(counter.draws).toBe(drawsAtStop);
  });
});
