import { describe, test, expect } from "vite-plus/test";
import { GML } from "gmljs";
import { RenderItemTags } from "../src/render/item/tags.ts";
import { RenderState } from "../src/render/state.ts";
import { ClientEnvironment } from "../src/environment/client.ts";
import { GMLTimeline } from "../src/animation/timeline.ts";
import { MockContext } from "./helpers/mock-context.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { GMLAnimationState } from "../src/animation/animation.ts";
import type { GMLTagTimelineFrame } from "../src/animation/timeline.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const example001 = readFileSync(join(__dirname, "data/example001.xml"), "utf8");

function makeStateAtFrame(
  gml: GML,
  frame: GMLTagTimelineFrame | undefined,
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
    time: frame?.t ?? 0,
    totalFrames: timeline.length,
    totalTime: last?.t ?? 0,
  };
  return new RenderState(new ClientEnvironment(width, height), animState);
}

describe("RenderItemTags", () => {
  test("draws moveTo + lineTo for every point in the stroke", () => {
    const gml = new GML(example001);
    const ctx = new MockContext();
    const { timelines } = new GMLTimeline(gml);
    const lastFrame = timelines[0][timelines[0].length - 1];

    new RenderItemTags(gml).render(ctx, makeStateAtFrame(gml, lastFrame));

    // example001 has a single 155-point stroke → 1 moveTo + 154 lineTo
    expect(ctx.only("moveTo")).toHaveLength(1);
    expect(ctx.only("lineTo")).toHaveLength(154);
  });

  test("emits stroke() once per drawn stroke", () => {
    const gml = new GML(example001);
    const ctx = new MockContext();
    const { timelines } = new GMLTimeline(gml);
    const lastFrame = timelines[0][timelines[0].length - 1];

    new RenderItemTags(gml).render(ctx, makeStateAtFrame(gml, lastFrame));

    expect(ctx.only("stroke")).toHaveLength(1);
  });

  test("renders only moveTo (no lineTo) when limited to the first point", () => {
    const gml = new GML(example001);
    const ctx = new MockContext();
    const { timelines } = new GMLTimeline(gml);
    // First frame already has point:0; time=0 suppresses the partial-segment interpolation
    const firstFrame = timelines[0][0];

    new RenderItemTags(gml).render(ctx, makeStateAtFrame(gml, firstFrame));

    expect(ctx.only("moveTo")).toHaveLength(1);
    expect(ctx.only("lineTo")).toHaveLength(0);
  });

  test("uses black (#000) as the stroke style", () => {
    const gml = new GML(example001);
    const tags = new RenderItemTags(gml);
    expect(tags.getRenderProps().strokeStyle).toBe("#000");
  });
});
