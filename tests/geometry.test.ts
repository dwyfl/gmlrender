import { describe, test, expect } from "vite-plus/test";
import { GMLView } from "../src/view.ts";
import { GMLRenderer } from "../src/render/index.ts";
import { MockContext } from "./helpers/mock-context.ts";

/**
 * Where documents land on canvases of other shapes. The document's screen bounds are
 * scaled uniformly to fit the canvas and centered; the rest is letterbox (bars at the top
 * and bottom) or pillarbox (bars at the sides).
 */

function gml({
  bounds,
  client,
  points = [
    [0.5, 0.5],
    [0.75, 0.5],
  ],
}: {
  bounds?: string;
  client?: string;
  points?: [number, number][];
}) {
  const header = client
    ? `<header><client><name>${client}</name></client></header>`
    : "";
  const environment = bounds
    ? `<environment><screenbounds>${bounds}</screenbounds></environment>`
    : "";
  const pts = points
    .map(([x, y], t) => `<pt><x>${x}</x><y>${y}</y><t>${t}</t></pt>`)
    .join("");
  return `<gml><tag>${header}${environment}<drawing><stroke>${pts}</stroke></drawing></tag></gml>`;
}

const bounds = (width: number, height: number) =>
  `<x>${width}</x><y>${height}</y>`;

function render(
  xml: string,
  width: number,
  height: number,
  setup?: (view: GMLView) => void,
) {
  const ctx = new MockContext(width, height);
  const view = new GMLView(xml, new GMLRenderer(ctx));
  setup?.(view);
  view.setPosition(1);
  view.draw();

  // The background item draws first: one closed path, then fill().
  const firstFill = ctx.calls.findIndex((c) => c.type === "fill");
  const points = (calls: typeof ctx.calls) =>
    calls.flatMap((c) =>
      c.type === "moveTo" || c.type === "lineTo" ? [{ x: c.x, y: c.y }] : [],
    );
  const corners = points(ctx.calls.slice(0, firstFill));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  return {
    ctx,
    document: {
      left: Math.min(...xs),
      top: Math.min(...ys),
      right: Math.max(...xs),
      bottom: Math.max(...ys),
    },
    stroke: points(ctx.calls.slice(firstFill)),
    lineWidth: ctx
      .only("setRenderProps")
      .findLast((c) => c.props.lineWidth !== undefined)?.props.lineWidth,
  };
}

function expectRect(
  actual: { left: number; top: number; right: number; bottom: number },
  [left, top, right, bottom]: [number, number, number, number],
) {
  expect(actual.left).toBeCloseTo(left, 2);
  expect(actual.top).toBeCloseTo(top, 2);
  expect(actual.right).toBeCloseTo(right, 2);
  expect(actual.bottom).toBeCloseTo(bottom, 2);
}

describe("Fitting the document into the canvas", () => {
  test.each([
    // [document bounds, canvas, expected document rect: left, top, right, bottom]
    [
      "3:2 into 4:3 (downscale): letterbox",
      [480, 320],
      [320, 240],
      [0, 13.333, 320, 226.667],
    ],
    [
      "3:2 into 4:3 (upscale): letterbox",
      [480, 320],
      [1024, 768],
      [0, 42.667, 1024, 725.333],
    ],
    ["3:2 into a square: letterbox", [480, 320], [300, 300], [0, 50, 300, 250]],
    ["2:3 into 4:3: pillarbox", [320, 480], [320, 240], [80, 0, 240, 240]],
    [
      "1:1.5 into 4:3, same height: pillarbox",
      [160, 240],
      [320, 240],
      [80, 0, 240, 240],
    ],
    [
      "4:3 into 4:3 (upscale): fills the canvas",
      [320, 240],
      [1024, 768],
      [0, 0, 1024, 768],
    ],
    [
      "4:3 into 16:9: pillarbox",
      [1024, 768],
      [1920, 1080],
      [240, 0, 1680, 1080],
    ],
  ] as const)("%s", (_, [bw, bh], [cw, ch], expected) => {
    const { document } = render(gml({ bounds: bounds(bw, bh) }), cw, ch);
    expectRect(document, [...expected]);
  });

  test.each([
    ["no <screenbounds> (1024×768 default)", undefined],
    ["zero <screenbounds>", bounds(0, 0)],
  ])("%s falls back to filling the canvas", (_, b) => {
    const { document } = render(gml({ bounds: b }), 320, 240);
    expectRect(document, [0, 0, 320, 240]);
  });

  test("incomplete <screenbounds> gets gmljs' 1920×1080 default for the missing value", () => {
    // <x>480</x> alone becomes 480×1080: a tall document, pillarboxed.
    const { document } = render(gml({ bounds: "<x>480</x>" }), 320, 240);
    expectRect(document, [106.667, 0, 213.333, 240]);
  });

  test("scales uniformly: a square on the original screen stays square", () => {
    // 48×48 device pixels on a 480×320 screen = 0.1 × 0.15 in GML coordinates.
    const xml = gml({
      bounds: bounds(480, 320),
      points: [
        [0.4, 0.4],
        [0.5, 0.4],
        [0.5, 0.55],
      ],
    });
    for (const [width, height] of [
      [320, 240],
      [300, 300],
      [1920, 1080],
    ] as const) {
      const [a, b, c] = render(xml, width, height).stroke;
      const horizontal = b!.x - a!.x;
      const vertical = c!.y - b!.y;
      expect(vertical).toBeCloseTo(horizontal, 2);
    }
  });

  test("scales the line width with the document", () => {
    // Default line width 4 at the document's own size.
    expect(
      render(gml({ bounds: bounds(480, 320) }), 320, 240).lineWidth,
    ).toBeCloseTo((4 * 320) / 480, 3);
    expect(
      render(gml({ bounds: bounds(320, 480) }), 320, 240).lineWidth,
    ).toBeCloseTo((4 * 160) / 320, 3);
    expect(
      render(gml({ bounds: bounds(480, 320) }), 960, 640).lineWidth,
    ).toBeCloseTo(8, 3);
  });
});

describe("Rotated documents (Fat Tag / DustTag: 480×320, up = (1,0,0))", () => {
  // Pins the current behavior, which matches reference renders of real Fat Tag documents:
  // the fit uses the unrotated 480×320 bounds, and the up vector (+x) points up on screen.
  const katsu = (points?: [number, number][]) =>
    gml({ client: "Fat Tag - Katsu Edition", points });

  test("fits into the same letterboxed area as an unrotated 3:2 document", () => {
    const { document } = render(katsu(), 320, 240);
    expectRect(document, [0, 13.333, 320, 226.667]);
  });

  test("+x in the document points up on screen", () => {
    // (0.5, 0.5) → (0.75, 0.5): a step along +x moves the pen upwards.
    const [from, to] = render(katsu(), 320, 240).stroke;
    expect(from!.x).toBeCloseTo(160, 2);
    expect(from!.y).toBeCloseTo(120, 2);
    expect(to!.x).toBeCloseTo(160, 2);
    expect(to!.y).toBeCloseTo(120 - 0.25 * 213.333, 2);
  });

  test("+y in the document points right on screen", () => {
    const [from, to] = render(
      katsu([
        [0.5, 0.5],
        [0.5, 0.75],
      ]),
      320,
      240,
    ).stroke;
    expect(to!.x - from!.x).toBeCloseTo(0.25 * 320, 2);
    expect(to!.y - from!.y).toBeCloseTo(0, 2);
  });
});

describe("View controls", () => {
  // A 4:3 document on a 4:3 canvas; the stroke goes from the center 0.25 to the right (80px).
  const xml = gml({});

  test("setScale() scales around the canvas center", () => {
    const [from, to] = render(xml, 320, 240, (view) => view.setScale(2)).stroke;
    expect(from!.x).toBeCloseTo(160, 2);
    expect(to!.x - from!.x).toBeCloseTo(160, 2);
  });

  test("setOffset() moves the drawing in pixels", () => {
    const { stroke, document } = render(xml, 320, 240, (view) =>
      view.setOffset(10, -5),
    );
    expect(stroke[0]!.x).toBeCloseTo(170, 2);
    expect(stroke[0]!.y).toBeCloseTo(115, 2);
    expectRect(document, [10, -5, 330, 235]);
  });

  test("setSize() resizes the canvas and refits the document", () => {
    const { ctx, document, stroke } = render(xml, 320, 240, (view) =>
      view.setSize(640, 480),
    );
    expect([ctx.width, ctx.height]).toEqual([640, 480]);
    expectRect(document, [0, 0, 640, 480]);
    expect(stroke[1]!.x - stroke[0]!.x).toBeCloseTo(160, 2);
  });
});
