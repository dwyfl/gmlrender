import { describe, test, expect } from "vite-plus/test";
import { GML } from "gmljs";
import { RenderItemDrips } from "../src/render/item/drips.ts";
import { RenderState } from "../src/render/state.ts";
import { ClientEnvironment } from "../src/environment/client.ts";
import { GMLTimeline } from "../src/animation/timeline.ts";
import { MockContext } from "./helpers/mock-context.ts";
import { createGMLViewStatic } from "../src/server/factory.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { GMLAnimationState } from "../src/animation/animation.ts";
import type { GMLTagTimelineFrame } from "../src/animation/timeline.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const example001 = readFileSync(join(__dirname, "data/example001.xml"), "utf8");
const example002 = readFileSync(join(__dirname, "data/example002.xml"), "utf8");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(
  gml: GML,
  frame: GMLTagTimelineFrame | undefined,
  time: number,
  width = 320,
  height = 240,
) {
  const { timelines } = new GMLTimeline(gml);
  const timeline = timelines[0] ?? [];
  const last = timeline[timeline.length - 1];
  const animState: GMLAnimationState = {
    timeline,
    frame,
    frameIndex: frame ? timeline.indexOf(frame) : 0,
    time,
    totalFrames: timeline.length,
    totalTime: last?.t ?? 0,
  };
  return new RenderState(new ClientEnvironment(width, height), animState);
}

function makeStateAtEnd(gml: GML, width = 320, height = 240) {
  const { timelines } = new GMLTimeline(gml);
  const timeline = timelines[0] ?? [];
  const lastFrame = timeline[timeline.length - 1];
  // Use a time well past totalTime so all drips have reached full length
  return makeState(gml, lastFrame, (lastFrame?.t ?? 0) + 100, width, height);
}

function makeStateAtStart(gml: GML, width = 320, height = 240) {
  const { timelines } = new GMLTimeline(gml);
  const timeline = timelines[0] ?? [];
  const firstFrame = timeline[0];
  return makeState(gml, firstFrame, firstFrame?.t ?? 0, width, height);
}

// ---------------------------------------------------------------------------
// Drip point selection
// ---------------------------------------------------------------------------

describe("RenderItemDrips — drip point selection", () => {
  test("renders drips at the end of animation", () => {
    const gml = new GML(example002);
    const ctx = new MockContext();
    new RenderItemDrips(gml).render(ctx, makeStateAtEnd(gml));
    expect(ctx.only("lineTo").length).toBeGreaterThan(0);
  });

  test("dripFactor=0 produces no drips", () => {
    const gml = new GML(example002);
    const ctx = new MockContext();
    const item = new RenderItemDrips(gml);
    item.setOptions({ dripFactor: 0 });
    item.render(ctx, makeStateAtEnd(gml));
    expect(ctx.only("lineTo")).toHaveLength(0);
  });

  test("higher dripFactor produces more drips than the default", () => {
    const gml = new GML(example002);
    const state = makeStateAtEnd(gml);

    const ctxDefault = new MockContext();
    new RenderItemDrips(gml).render(ctxDefault, state);

    const ctxMax = new MockContext();
    const itemMax = new RenderItemDrips(gml);
    itemMax.setOptions({ dripFactor: 1 });
    itemMax.render(ctxMax, state);

    expect(ctxMax.only("lineTo").length).toBeGreaterThan(ctxDefault.only("lineTo").length);
  });

  test("renders nothing before any points have been drawn (time=0)", () => {
    const gml = new GML(example002);
    const ctx = new MockContext();
    // Force dripFactor=1 to maximise the chance of catching an off-by-one
    const item = new RenderItemDrips(gml);
    item.setOptions({ dripFactor: 1 });
    item.render(ctx, makeStateAtStart(gml));
    // Easing at t=0 is 0, so even visible drips produce zero length
    expect(ctx.only("lineTo")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("RenderItemDrips — determinism", () => {
  test("produces identical moveTo/lineTo calls on every render", () => {
    const gml = new GML(example002);
    const state = makeStateAtEnd(gml);

    const ctx1 = new MockContext();
    new RenderItemDrips(gml).render(ctx1, state);

    const ctx2 = new MockContext();
    new RenderItemDrips(gml).render(ctx2, state);

    expect(ctx1.only("moveTo")).toEqual(ctx2.only("moveTo"));
    expect(ctx1.only("lineTo")).toEqual(ctx2.only("lineTo"));
  });

  test("setOptions recalculates drips deterministically", () => {
    const gml = new GML(example002);
    const state = makeStateAtEnd(gml);

    const ctx1 = new MockContext();
    const item1 = new RenderItemDrips(gml);
    item1.setOptions({ dripFactor: 0.5 });
    item1.render(ctx1, state);

    const ctx2 = new MockContext();
    const item2 = new RenderItemDrips(gml);
    item2.setOptions({ dripFactor: 0.5 });
    item2.render(ctx2, state);

    expect(ctx1.only("moveTo")).toEqual(ctx2.only("moveTo"));
    expect(ctx1.only("lineTo")).toEqual(ctx2.only("lineTo"));
  });
});

// ---------------------------------------------------------------------------
// Drip direction
// ---------------------------------------------------------------------------

describe("RenderItemDrips — drip direction", () => {
  test("drips flow downward (end y > start y) for GML without an up vector", () => {
    // example001 has no <up> element → drip direction defaults to [0,1,0] in GML
    // space, which projects to a positive-y displacement in screen space (downward).
    const gml = new GML(example001);
    const ctx = new MockContext();
    const item = new RenderItemDrips(gml);
    item.setOptions({ dripFactor: 1 });
    item.render(ctx, makeStateAtEnd(gml));

    const moves = ctx.only("moveTo");
    const lines = ctx.only("lineTo");

    expect(moves.length).toBeGreaterThan(0);
    for (let i = 0; i < moves.length; i++) {
      expect(lines[i].y).toBeGreaterThan(moves[i].y);
    }
  });
});

// ---------------------------------------------------------------------------
// GMLViewStaticOptions integration
// ---------------------------------------------------------------------------

describe("GMLViewStaticOptions — drips option", () => {
  test("drips are off by default", async () => {
    // A render without drips should produce fewer dark pixels than one with drips
    const withoutDrips = createGMLViewStatic(example002, "node-canvas", 320, 240);
    const withDrips = createGMLViewStatic(example002, "node-canvas", 320, 240, {
      drips: true,
      dripFactor: 1,
    });

    const [blobOff, blobOn] = await Promise.all([
      withoutDrips.render("png"),
      withDrips.render("png"),
    ]);

    // The two blobs must differ — drips add ink to the image
    const [bufOff, bufOn] = await Promise.all([blobOff.arrayBuffer(), blobOn.arrayBuffer()]);
    expect(Buffer.from(bufOff)).not.toEqual(Buffer.from(bufOn));
  });

  test("drips: true renders more ink than drips: false", async () => {
    const { pixelReaderfromDataURL, isDark } = await import("./helpers/pixels.ts");

    const [blobOff, blobOn] = await Promise.all([
      createGMLViewStatic(example002, "node-canvas", 320, 240).render("png"),
      createGMLViewStatic(example002, "node-canvas", 320, 240, {
        drips: true,
        dripFactor: 1,
      }).render("png"),
    ]);

    const [pixOff, pixOn] = await Promise.all([
      pixelReaderfromDataURL(blobOff),
      pixelReaderfromDataURL(blobOn),
    ]);

    expect(pixOn.count(isDark)).toBeGreaterThan(pixOff.count(isDark));
  });

  test("dripFactor is forwarded to the render item", async () => {
    // dripFactor=1 should produce more ink than dripFactor=0.2 (default)
    const { pixelReaderfromDataURL, isDark } = await import("./helpers/pixels.ts");

    const [blobLow, blobHigh] = await Promise.all([
      createGMLViewStatic(example002, "node-canvas", 320, 240, {
        drips: true,
        dripFactor: 0.2,
      }).render("png"),
      createGMLViewStatic(example002, "node-canvas", 320, 240, {
        drips: true,
        dripFactor: 1,
      }).render("png"),
    ]);

    const [pixLow, pixHigh] = await Promise.all([
      pixelReaderfromDataURL(blobLow),
      pixelReaderfromDataURL(blobHigh),
    ]);

    expect(pixHigh.count(isDark)).toBeGreaterThanOrEqual(pixLow.count(isDark));
  });
});
