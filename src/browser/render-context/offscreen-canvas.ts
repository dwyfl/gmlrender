import type { RenderImageOptions } from "../../render/context.ts";
import { RenderContextCanvas2D } from "./base.ts";

export class RenderContextOffscreenCanvas extends RenderContextCanvas2D<OffscreenCanvas> {
  constructor(canvas: OffscreenCanvas);
  constructor(width: number, height: number);
  constructor(canvasOrWidth: OffscreenCanvas | number, height?: number) {
    let canvas: OffscreenCanvas;
    if (canvasOrWidth instanceof OffscreenCanvas) {
      canvas = canvasOrWidth;
    } else {
      canvas = new OffscreenCanvas(canvasOrWidth, height!);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get OffscreenCanvas 2D context.");
    }
    super(canvas, ctx);
  }

  async renderToDataURL(options: RenderImageOptions = { type: "jpeg" }): Promise<string> {
    // toDataURL() is not native for OffscreenCanvas
    const blob = await this.renderToBlob(options);
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return `data:${blob.type};base64,${btoa(binary)}`;
  }

  renderToBlob({ type, quality }: RenderImageOptions = { type: "jpeg" }): Promise<Blob> {
    return this.canvas.convertToBlob({ type: `image/${type}`, quality });
  }
}
