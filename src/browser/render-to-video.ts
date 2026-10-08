/**
 * Browser-only video rendering using mediabunny (WebCodecs).
 * Produces MP4, WebM, or MKV output.
 */
import {
  Output,
  Mp4OutputFormat,
  WebMOutputFormat,
  MkvOutputFormat,
  BufferTarget,
  CanvasSource,
  QUALITY_HIGH,
  type Quality,
} from "mediabunny";
import { GMLView } from "../view.ts";
import { GMLRenderer } from "../render/index.ts";
import { RenderContextOffscreenCanvas } from "./render-context/offscreen-canvas.ts";
import { GML } from "gmljs";
import type { RenderOptions } from "../render/options.ts";

export type GMLVideoCodec = "avc" | "hevc" | "vp8" | "vp9" | "av1";
export type GMLVideoContainerFormat = "mp4" | "webm" | "mkv";

export interface GMLVideoRenderOptions extends Partial<RenderOptions> {
  width?: number;
  height?: number;
  fps?: number;
  codec?: GMLVideoCodec;
  /** Bits per second, or one of mediabunny's QUALITY_* constants. */
  bitrate?: number | Quality;
  format?: GMLVideoContainerFormat;
  /** Aborts rendering; the returned promise rejects with the signal's reason. */
  signal?: AbortSignal;
}

/**
 * Renders a GML animation to a video file in the browser.
 * Uses the WebCodecs API via mediabunny — not available in Node.js.
 *
 * @returns A Uint8Array containing the encoded video bytes.
 */
export async function renderToVideo(
  gml: string | GML,
  options?: GMLVideoRenderOptions,
): Promise<Uint8Array> {
  const {
    width = 640,
    height = 480,
    fps = 30,
    codec = "avc",
    bitrate = QUALITY_HIGH,
    format = "mp4",
    signal,
  } = options ?? {};

  if (!Number.isFinite(fps) || fps <= 0) {
    throw new RangeError(`fps must be a positive number, got ${fps}`);
  }
  signal?.throwIfAborted();

  const ctx = new RenderContextOffscreenCanvas(width, height);

  const outputFormat =
    format === "webm"
      ? new WebMOutputFormat()
      : format === "mkv"
        ? new MkvOutputFormat()
        : new Mp4OutputFormat();

  const output = new Output({
    format: outputFormat,
    target: new BufferTarget(),
  });

  const canvasSource = new CanvasSource(ctx.canvas, { codec, bitrate });
  output.addVideoTrack(canvasSource, { frameRate: fps });

  const view = new GMLView(gml, new GMLRenderer(ctx));
  view.setRenderOptions(options ?? {});

  try {
    await output.start();

    const { totalTime } = view.state;
    const frameDuration = 1 / fps;
    // Zero-duration documents (e.g. a single point) still produce one frame.
    const frameCount = Math.max(1, Math.ceil(totalTime * fps));

    for (let i = 0; i < frameCount; i++) {
      signal?.throwIfAborted();
      const timestamp = i * frameDuration;
      const animTime = i === frameCount - 1 ? totalTime : timestamp;
      view.setTime(animTime);
      view.draw();
      await canvasSource.add(timestamp, frameDuration);
    }

    await output.finalize();
  } catch (error) {
    // Release the encoder; the output is unusable after a failure.
    if (output.state !== "canceled" && output.state !== "finalized") {
      await output.cancel();
    }
    throw error;
  }

  const { buffer } = output.target;
  if (!buffer) {
    throw new Error("Failed to finalize video output");
  }
  return new Uint8Array(buffer);
}
