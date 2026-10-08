import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vite-plus/test";
import {
  createGMLView,
  createGMLImage,
  ServerRenderContext,
} from "../src/server/index.ts";
import { GMLRenderer } from "../src/render/index.ts";
import type { GMLView } from "../src/view.ts";
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

// ---------------------------------------------------------------------------
// Render settings survive rebuilding the render items
// ---------------------------------------------------------------------------
describe("Render item settings", () => {
  function customize(view: GMLView) {
    view.setRenderItemProps("background", { fillStyle: "#ff0000" });
    view.setRenderItemProps("tags", { strokeStyle: "#00ff00" });
    view.getRenderItem("tags")?.item.setOptions({ brushSizeMultiplier: 3 });
    view.setRenderItemVisible("drips", true);
    view.getRenderItem("drips")?.item.setOptions({ dripFactor: 0.7 });
  }

  function expectCustomized(view: GMLView) {
    const background = view.getRenderItem("background");
    const tags = view.getRenderItem("tags");
    const drips = view.getRenderItem("drips");
    expect(background?.item.getRenderProps().fillStyle).toBe("#ff0000");
    expect(tags?.item.getRenderProps().strokeStyle).toBe("#00ff00");
    expect(tags?.item.getOptions().brushSizeMultiplier).toBe(3);
    expect(drips?.visible).toBe(true);
    expect(drips?.item.getOptions().dripFactor).toBe(0.7);
  }

  test("survive setGml()", () => {
    const view = createGMLView(example000, size);
    customize(view);
    view.setGml(example001);
    expectCustomized(view);
  });

  test("survive setRenderer()", () => {
    const view = createGMLView(example001, size);
    customize(view);
    view.setRenderer(
      new GMLRenderer(ServerRenderContext.createRenderContext(size)),
    );
    expectCustomized(view);
  });

  test("a new view starts with drips hidden", () => {
    expect(
      createGMLView(example001, size).getRenderItem("drips")?.visible,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GMLView.setRenderOptions
// ---------------------------------------------------------------------------
describe("GMLView.setRenderOptions", () => {
  test("applies each option to the built-in render items", () => {
    const view = createGMLView(example001, size);
    view.setRenderOptions({
      background: "#123456",
      color: "#ff0000",
      brushSizeMultiplier: 2,
      drips: true,
      dripFactor: 0.6,
    });
    const background = view.getRenderItem("background");
    const tags = view.getRenderItem("tags");
    const drips = view.getRenderItem("drips");
    expect(background?.item.getRenderProps().fillStyle).toBe("#123456");
    expect(tags?.item.getRenderProps().strokeStyle).toBe("#ff0000");
    expect(drips?.item.getRenderProps().strokeStyle).toBe("#ff0000");
    expect(tags?.item.getOptions().brushSizeMultiplier).toBe(2);
    expect(drips?.visible).toBe(true);
    expect(drips?.item.getOptions().dripFactor).toBe(0.6);
  });

  test("leaves options that are not given unchanged", () => {
    const view = createGMLView(example001, size);
    view.setRenderOptions({ color: "#ff0000", drips: true });
    view.setRenderOptions({ brushSizeMultiplier: 2 });
    expect(view.getRenderItem("tags")?.item.getRenderProps().strokeStyle).toBe(
      "#ff0000",
    );
    expect(view.getRenderItem("drips")?.visible).toBe(true);
  });

  test("drips: false hides the drips again", () => {
    const view = createGMLView(example001, size);
    view.setRenderOptions({ drips: true });
    view.setRenderOptions({ drips: false });
    expect(view.getRenderItem("drips")?.visible).toBe(false);
  });

  test("createGMLView accepts render options", async () => {
    const view = createGMLView(example001, { ...size, color: "#ff0000" });
    view.setPosition(1);
    view.draw();
    const pixels = await pixelReaderfromDataURL(
      await view.renderContext.renderToArrayBuffer({ type: "png" }),
    );
    expect(pixels.count(isRed)).toBeGreaterThan(100);
    expect(pixels.count(isDark)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Background vs. clear color (area outside the document)
// ---------------------------------------------------------------------------
describe("clearColor", () => {
  // A 480×320 (3:2) document on a 320×240 (4:3) canvas: the document fills
  // 320×213, leaving ~13px bars at the top and bottom.
  const WIDE_GML = `<gml><tag><environment><screenbounds><x>480</x><y>320</y></screenbounds></environment>
    <drawing><stroke><pt><x>0.4</x><y>0.4</y><t>0</t></pt><pt><x>0.6</x><y>0.4</y><t>1</t></pt></stroke></drawing></tag></gml>`;
  const BAR = [160, 3] as const;
  const DOCUMENT = [20, 120] as const;

  const isGreen = (px: { r: number; g: number; b: number; a: number }) =>
    px.r < 60 && px.g > 200 && px.b < 60 && px.a > 200;

  test("defaults to the background color, so the whole image is filled", async () => {
    const pixels = await pixelReaderfromDataURL(
      await createGMLImage(WIDE_GML, { ...size, background: "#ff0000" }),
    );
    expect(isRed(pixels.at(...BAR))).toBe(true);
    expect(isRed(pixels.at(...DOCUMENT))).toBe(true);
  });

  test('"transparent" keeps the area outside the document transparent', async () => {
    const pixels = await pixelReaderfromDataURL(
      await createGMLImage(WIDE_GML, {
        ...size,
        background: "#ff0000",
        clearColor: "transparent",
      }),
    );
    expect(pixels.at(...BAR).a).toBe(0);
    expect(isRed(pixels.at(...DOCUMENT))).toBe(true);
  });

  test("can differ from the background color", async () => {
    const pixels = await pixelReaderfromDataURL(
      await createGMLImage(WIDE_GML, {
        ...size,
        background: "#ff0000",
        clearColor: "#00ff00",
      }),
    );
    expect(isGreen(pixels.at(...BAR))).toBe(true);
    expect(isRed(pixels.at(...DOCUMENT))).toBe(true);
  });

  test("a hidden background leaves the canvas transparent", async () => {
    const view = createGMLView(WIDE_GML, size);
    view.setRenderItemVisible("background", false);
    view.draw();
    const pixels = await pixelReaderfromDataURL(
      await view.renderContext.renderToArrayBuffer({ type: "png" }),
    );
    expect(pixels.at(...BAR).a).toBe(0);
    expect(pixels.at(...DOCUMENT).a).toBe(0);
  });

  test("a semi-transparent clear color does not build up over frames", async () => {
    const view = createGMLView(WIDE_GML, {
      ...size,
      clearColor: "rgba(0, 0, 0, 0.5)",
    });
    view.draw();
    view.draw();
    view.draw();
    const pixels = await pixelReaderfromDataURL(
      await view.renderContext.renderToArrayBuffer({ type: "png" }),
    );
    expect(pixels.at(...BAR).a).toBeGreaterThan(120);
    expect(pixels.at(...BAR).a).toBeLessThan(135);
  });
});
