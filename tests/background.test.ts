import { describe, test, expect } from "vite-plus/test";
import { GML } from "gmljs";
import { RenderItemBackground } from "../src/render/item/background.ts";
import { RenderState } from "../src/render/state.ts";
import { ClientEnvironment } from "../src/environment/client.ts";
import { MockContext } from "./helpers/mock-context.ts";
import type { GMLAnimationState } from "../src/animation/animation.ts";

const SINGLE_TAG_GML = `<gml spec="1.0"><tag><drawing><stroke>
  <pt><x>0.5</x><y>0.5</y></pt>
</stroke></drawing></tag></gml>`;

function makeRenderState(width = 320, height = 240): RenderState {
  const animState: GMLAnimationState = {
    timeline: [],
    frame: undefined,
    frameIndex: 0,
    time: 0,
    totalFrames: 0,
    totalTime: 0,
  };
  return new RenderState(new ClientEnvironment(width, height), animState);
}

describe("RenderItemBackground", () => {
  test("fills with white (#fff) by default", () => {
    const ctx = new MockContext();
    new RenderItemBackground(new GML(SINGLE_TAG_GML)).render(ctx, makeRenderState());

    const fillStyles = ctx
      .only("setRenderProps")
      .map((c) => c.props.fillStyle)
      .filter(Boolean);
    expect(fillStyles).toContain("#fff");
    expect(ctx.only("fill")).toHaveLength(1);
  });

  test("fills with a custom color when one is provided", () => {
    const ctx = new MockContext();
    new RenderItemBackground(new GML(SINGLE_TAG_GML), "#abcdef").render(ctx, makeRenderState());

    const fillStyles = ctx
      .only("setRenderProps")
      .map((c) => c.props.fillStyle)
      .filter(Boolean);
    expect(fillStyles).toContain("#abcdef");
  });

  test("draws a closed 4-corner path (beginPath + moveTo + 3×lineTo + closePath + fill)", () => {
    const ctx = new MockContext(320, 240);
    new RenderItemBackground(new GML(SINGLE_TAG_GML)).render(ctx, makeRenderState(320, 240));

    expect(ctx.only("beginPath")).toHaveLength(1);
    expect(ctx.only("moveTo")).toHaveLength(1);
    expect(ctx.only("lineTo")).toHaveLength(3);
    expect(ctx.only("closePath")).toHaveLength(1);
    expect(ctx.only("fill")).toHaveLength(1);
  });

  test("path corners land on the canvas edges", () => {
    const ctx = new MockContext(320, 240);
    new RenderItemBackground(new GML(SINGLE_TAG_GML)).render(ctx, makeRenderState(320, 240));

    const corners = [...ctx.only("moveTo"), ...ctx.only("lineTo")].map(
      (c) => `${Math.round(c.x)},${Math.round(c.y)}`,
    );
    expect(corners).toContain("0,0");
    expect(corners).toContain("0,240");
    expect(corners).toContain("320,240");
    expect(corners).toContain("320,0");
  });
});
