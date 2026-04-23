import type { GMLView } from "../view.ts";

export interface GMLVideoRenderOptions {
  fps?: number;
  quality?: number; // WebP encoding quality, 0–100. Default 80.
  lossless?: boolean;
}

export async function renderToVideo(
  view: GMLView,
  options?: GMLVideoRenderOptions,
): Promise<Uint8Array> {
  const { fps = 30, quality = 80, lossless = false } = options ?? {};

  const ctx = view.renderContext;

  const { totalTime } = view.state;
  const frameDuration = 1 / fps;
  const frameCount = Math.ceil(totalTime * fps);
  const frameDurationMs = Math.round(1000 / fps);
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

  const { encodeAnimation } = await import("wasm-webp");
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
