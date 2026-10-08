import {
  describe,
  test,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vite-plus/test";
import { createCanvas } from "canvas";

// mediabunny needs WebCodecs, which Node.js lacks: record what renderToVideo does instead.
const mocks = vi.hoisted(() => ({
  canvas: null as import("canvas").Canvas | null,
  timestamps: [] as number[],
  failAtFrame: -1,
  canceled: false,
}));

vi.mock("mediabunny", () => {
  class BufferTarget {
    buffer: ArrayBuffer | null = null;
  }
  class Output {
    state = "pending";
    target: BufferTarget;
    constructor({ target }: { target: BufferTarget }) {
      this.target = target;
    }
    addVideoTrack() {}
    async start() {
      this.state = "started";
    }
    async finalize() {
      this.state = "finalized";
      this.target.buffer = new ArrayBuffer(8);
    }
    async cancel() {
      this.state = "canceled";
      mocks.canceled = true;
    }
  }
  class CanvasSource {
    constructor(canvas: import("canvas").Canvas) {
      mocks.canvas = canvas;
    }
    async add(timestamp: number) {
      if (mocks.timestamps.length === mocks.failAtFrame) {
        throw new Error("encoder failed");
      }
      mocks.timestamps.push(timestamp);
    }
  }
  class Format {}
  return {
    Output,
    BufferTarget,
    CanvasSource,
    Mp4OutputFormat: Format,
    WebMOutputFormat: Format,
    MkvOutputFormat: Format,
    QUALITY_HIGH: {},
  };
});

const { renderToVideo } = await import("../src/browser/render-to-video.ts");

// Two points one second apart.
const GML_1S =
  "<gml><tag><drawing><stroke><pt><x>0.1</x><y>0.1</y><t>0</t></pt><pt><x>0.9</x><y>0.9</y><t>1</t></pt></stroke></drawing></tag></gml>";
const GML_SINGLE_POINT =
  "<gml><tag><drawing><stroke><pt><x>0.5</x><y>0.5</y><t>0</t></pt></stroke></drawing></tag></gml>";

describe("renderToVideo", () => {
  beforeAll(() => {
    // Stand-in for the browser's OffscreenCanvas.
    vi.stubGlobal(
      "OffscreenCanvas",
      class {
        constructor(width: number, height: number) {
          return createCanvas(width, height);
        }
      },
    );
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });
  beforeEach(() => {
    mocks.timestamps = [];
    mocks.failAtFrame = -1;
    mocks.canceled = false;
  });

  test("encodes ceil(duration × fps) frames from a GML string", async () => {
    const video = await renderToVideo(GML_1S, { fps: 10 });
    expect(video).toBeInstanceOf(Uint8Array);
    expect(mocks.timestamps).toHaveLength(10);
    expect(mocks.timestamps[1]).toBeCloseTo(0.1);
  });

  test("applies render options to the video frames", async () => {
    await renderToVideo(GML_1S, {
      fps: 10,
      width: 100,
      height: 100,
      background: "#0000ff",
      color: "#ff0000",
      // The default 4px line is well under 1px at this size.
      brushSizeMultiplier: 10,
    });
    // The last drawn frame is still on the canvas.
    const { data } = mocks
      .canvas!.getContext("2d")
      .getImageData(0, 0, 100, 100);
    let red = 0;
    let blue = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i]! > 200 && data[i + 1]! < 60 && data[i + 2]! < 60) red++;
      if (data[i]! < 60 && data[i + 1]! < 60 && data[i + 2]! > 200) blue++;
    }
    expect(red).toBeGreaterThan(20);
    expect(blue).toBeGreaterThan(1000);
  });

  test("encodes one frame for a zero-duration document", async () => {
    await renderToVideo(GML_SINGLE_POINT, { fps: 10 });
    expect(mocks.timestamps).toHaveLength(1);
  });

  test("rejects a non-positive fps", async () => {
    await expect(renderToVideo(GML_1S, { fps: 0 })).rejects.toThrow(RangeError);
  });

  test("cancels the output when encoding fails", async () => {
    mocks.failAtFrame = 3;
    await expect(renderToVideo(GML_1S, { fps: 10 })).rejects.toThrow(
      "encoder failed",
    );
    expect(mocks.canceled).toBe(true);
  });

  test("stops and cancels the output when aborted", async () => {
    const controller = new AbortController();
    mocks.failAtFrame = -1;
    const promise = renderToVideo(GML_1S, {
      fps: 10,
      signal: controller.signal,
    });
    controller.abort(new Error("user aborted"));
    await expect(promise).rejects.toThrow("user aborted");
    expect(mocks.canceled).toBe(true);
    expect(mocks.timestamps.length).toBeLessThan(10);
  });
});
