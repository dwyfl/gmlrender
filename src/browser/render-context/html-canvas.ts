import type { RenderImageOptions } from "../../render/context.ts";
import { RenderContextCanvas2D } from "./base.ts";

export class RenderContextHtmlCanvas extends RenderContextCanvas2D<HTMLCanvasElement> {
  constructor(canvas: HTMLCanvasElement);
  constructor(width: number, height: number);
  constructor(canvasOrWidth: HTMLCanvasElement | number, height?: number) {
    let canvas: HTMLCanvasElement;
    if (canvasOrWidth instanceof HTMLCanvasElement) {
      canvas = canvasOrWidth;
    } else {
      canvas = document.createElement("canvas");
      canvas.width = canvasOrWidth;
      canvas.height = height!;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas 2D context.");
    }
    super(canvas, ctx);
  }

  renderToDataURL({ type, quality }: RenderImageOptions = { type: "jpeg" }): Promise<string> {
    return Promise.resolve(this.canvas.toDataURL(`image/${type}`, quality));
  }

  renderToBlob({ type, quality }: RenderImageOptions = { type: "jpeg" }): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob."))),
        `image/${type}`,
        quality,
      );
    });
  }
}
