import { Canvas, type CanvasRenderingContext2D } from "skia-canvas";
import {
  RenderContextBase,
  type RenderImageOptions,
} from "../../render/context.ts";
import {
  applyRenderProps,
  type RenderProps,
} from "../../render/props/index.ts";

export class RenderContextSkiaCanvas extends RenderContextBase {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    super();
    this.canvas = new Canvas(width, height);
    this.ctx = this.canvas.getContext("2d");
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
    applyRenderProps(this.ctx, props);
  }

  renderToDataURL(
    { type, quality }: RenderImageOptions = { type: "jpeg" },
  ): Promise<string> {
    return Promise.resolve(this.canvas.toDataURL(type, quality));
  }

  renderToBlob(
    { type, quality }: RenderImageOptions = { type: "jpeg" },
  ): Promise<Blob> {
    const buffer = this.canvas.toBufferSync(type, { quality });
    return Promise.resolve(
      new Blob([new Uint8Array(buffer)], { type: `image/${type}` }),
    );
  }
}
