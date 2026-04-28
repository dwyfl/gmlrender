import type { GMLView } from "../view.ts";

export interface GMLVideoRenderOptions {
  quality?: number; // WebP encoding quality, 0–100. Default 80.
  lossless?: boolean;
  fps?: number | { frames: number; duration: number };
}

export async function renderToWebp(
  view: GMLView,
  options?: GMLVideoRenderOptions,
): Promise<Uint8Array> {
  const { fps = 30, quality = 80, lossless = false } = options ?? {};

  const ctx = view.renderContext;

  const { totalTime } = view.state;
  const frameDuration = typeof fps === "number" ? 1 / fps : fps.duration;
  const frameDurationMs = Math.round(1000 * frameDuration);
  const frameCount = typeof fps === "number" ? Math.ceil(totalTime * fps) : fps.frames;
  const config = { lossless: lossless ? 1 : 0, quality } as const;

  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    const animTime = i === frameCount - 1 ? totalTime : i * frameDuration;
    view.setTime(animTime);
    view.draw();
    frames.push({
      data: await ctx.renderToRawPixels(),
      duration: frameDurationMs,
      config,
    });
  }

  const { createRequire } = await import("node:module");
  const { encodeAnimation } = createRequire(import.meta.url)("wasm-webp");
  const result = await encodeAnimation(
    view.renderContext.width,
    view.renderContext.height,
    true,
    frames,
  );
  if (!result) {
    throw new Error("Failed to encode animated WebP");
  }

  return result;
}
