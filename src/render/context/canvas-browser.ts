import { RenderContextBase, type RenderImageOptions } from "./base.ts";
import { type RenderProps } from "../props/index.ts";

export abstract class RenderContextCanvas2D<
  TCanvas extends { width: number; height: number },
> extends RenderContextBase {
  protected canvas: TCanvas;
  protected ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  constructor(canvas: TCanvas, ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
    super();
    this.canvas = canvas;
    this.ctx = ctx;
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  set width(value) {
    this.canvas.width = value;
  }

  set height(value) {
    this.canvas.height = value;
  }

  beginPath() {
    this.ctx.beginPath();
  }

  closePath() {
    this.ctx.closePath();
  }

  moveTo(x: number, y: number) {
    this.ctx.moveTo(x, y);
  }

  lineTo(x: number, y: number) {
    this.ctx.lineTo(x, y);
  }

  fill() {
    this.ctx.fill();
  }

  stroke() {
    this.ctx.stroke();
  }

  clear(color?: string) {
    if (color === undefined) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.lineWidth = 0;
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  setRenderProps(props: Partial<RenderProps>) {
    Object.entries(props).forEach(([key, value]) => {
      // @ts-expect-error
      this.ctx[key] = value;
    });
  }
}

export class RenderContextCanvasBrowser extends RenderContextCanvas2D<HTMLCanvasElement> {
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

export class RenderContextCanvasOffscreen extends RenderContextCanvas2D<OffscreenCanvas> {
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
