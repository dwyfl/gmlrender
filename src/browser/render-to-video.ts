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
} from "mediabunny";
import { GMLView } from "../view.ts";
import { GMLRenderer } from "../render/index.ts";
import { RenderContextOffscreenCanvas } from "./render-context/offscreen-canvas.ts";
import { GML } from "gmljs";

export type GMLVideoCodec = "avc" | "hevc" | "vp8" | "vp9" | "av1";
export type GMLVideoContainerFormat = "mp4" | "webm" | "mkv";

export interface GMLVideoRenderOptions {
  width?: number;
  height?: number;
  background?: string;
  fps?: number;
  codec?: GMLVideoCodec;
  bitrate?: number;
  format?: GMLVideoContainerFormat;
}

/**
 * Renders a GML animation to a video file in the browser.
 * Uses the WebCodecs API via mediabunny — not available in Node.js.
 *
 * @returns A Uint8Array containing the encoded video bytes.
 */
export async function renderToVideo(
  gml: GML,
  options?: GMLVideoRenderOptions,
): Promise<Uint8Array> {
  const {
    width = 640,
    height = 480,
    background,
    fps = 30,
    codec = "avc",
    bitrate = QUALITY_HIGH,
    format = "mp4",
  } = options ?? {};

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
  if (background) {
    view.setRenderItemProps("background", { fillStyle: background });
  }

  await output.start();

  const { totalTime } = view.state;
  const frameDuration = 1 / fps;
  const frameCount = Math.ceil(totalTime * fps);

  for (let i = 0; i < frameCount; i++) {
    const timestamp = i * frameDuration;
    const animTime = i === frameCount - 1 ? totalTime : timestamp;
    view.setTime(animTime);
    view.draw();
    await canvasSource.add(timestamp, frameDuration);
  }

  await output.finalize();

  const { buffer } = output.target;
  if (!buffer) {
    throw new Error("Failed to finalize video output");
  }
  return new Uint8Array(buffer);
}
