import { describe, test, expect } from "vite-plus/test";
import {
  BaseRenderProps,
  applyRenderProps,
} from "../src/render/props/index.ts";
import { RenderContextSkiaCanvas } from "../src/server/render-context/skia-canvas.ts";
import { RenderContextNodeCanvas } from "../src/server/render-context/node-canvas.ts";
import { requireOptional } from "../src/server/require-optional.ts";

describe("applyRenderProps", () => {
  test("ignores unknown keys, invalid values and __proto__", () => {
    const props = new BaseRenderProps();
    // JSON.parse creates an own "__proto__" key, like untrusted input would.
    applyRenderProps(
      props,
      JSON.parse(
        '{"__proto__": {"polluted": true}, "lineWidth": 7, "lineCap": "invalid", "font": "x"}',
      ),
    );
    expect(Object.getPrototypeOf(props)).toBe(BaseRenderProps.prototype);
    expect(props.lineWidth).toBe(7);
    expect(props.lineCap).toBe("round");
    expect(Object.hasOwn(props, "font")).toBe(false);
  });

  test("is applied by render contexts", () => {
    const context = new RenderContextNodeCanvas(10, 10);
    context.setRenderProps(JSON.parse('{"lineWidth": 5, "lineJoin": "nope"}'));
    // The canvas keeps its default lineJoin ("miter"); the valid lineWidth is applied.
    const ctx = (context as unknown as { ctx: CanvasRenderingContext2D }).ctx;
    expect(ctx.lineWidth).toBe(5);
    expect(ctx.lineJoin).toBe("miter");
  });
});

describe("RenderContextSkiaCanvas", () => {
  test.each([
    ["png", "89504e47"],
    ["jpeg", "ffd8ff"],
  ] as const)("renderToBlob encodes %s", async (type, magic) => {
    const blob = await new RenderContextSkiaCanvas(10, 10).renderToBlob({
      type,
    });
    const bytes = Buffer.from(await blob.arrayBuffer());
    expect(bytes.toString("hex").startsWith(magic)).toBe(true);
    expect(blob.type).toBe(`image/${type}`);
  });
});

describe("requireOptional", () => {
  test("loads an installed package", () => {
    const canvas = requireOptional<typeof import("canvas")>("canvas", "Test");
    expect(typeof canvas.createCanvas).toBe("function");
  });

  test("explains how to install a missing package", () => {
    let error: unknown;
    try {
      requireOptional("gmlrender-missing-package", 'The "test" render context');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(
      'The "test" render context requires the optional "gmlrender-missing-package" package',
    );
    expect((error as Error).message).toContain(
      "npm install gmlrender-missing-package",
    );
    expect((error as Error).cause).toBeInstanceOf(Error);
  });
});
