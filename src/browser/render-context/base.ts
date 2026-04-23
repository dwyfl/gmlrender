import { RenderContextBase } from "../../render/context.ts";
import { type RenderProps } from "../../render/props/index.ts";

export abstract class RenderContextCanvas2D<
  TCanvas extends { width: number; height: number },
> extends RenderContextBase {
  canvas: TCanvas;
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
