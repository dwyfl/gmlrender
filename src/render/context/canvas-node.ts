import { createCanvas, type Canvas, type CanvasRenderingContext2D } from "canvas";
import { RenderContextBase, type RenderImageOptions } from "./base.ts";
import { type RenderProps } from "../props/index.ts";

export class RenderContextCanvasNode extends RenderContextBase {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    super();
    this.canvas = createCanvas(width, height);
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
    Object.entries(props).forEach(([key, value]) => {
      // @ts-expect-error TODO: validate
      this.ctx[key] = value;
    });
  }

  renderToDataURL({ type, quality }: RenderImageOptions = { type: "jpeg" }): Promise<string> {
    const dataURL =
      type === "png"
        ? this.canvas.toDataURL("image/png")
        : this.canvas.toDataURL("image/jpeg", quality);
    return Promise.resolve(dataURL);
  }

  renderToBlob({ type, quality }: RenderImageOptions = { type: "jpeg" }): Promise<Blob> {
    const buffer =
      type === "png"
        ? this.canvas.toBuffer("image/png")
        : this.canvas.toBuffer("image/jpeg", { quality });
    return Promise.resolve(new Blob([new Uint8Array(buffer)], { type: `image/${type}` }));
  }
}
