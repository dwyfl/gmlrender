import { RenderContextBase } from "./base.ts";
import {
  createCanvas,
  getCanvasContext,
  type GMLCanvas,
  type GMLCanvasContext,
} from "../../isomorphic/canvas.ts";
import { type RenderProps } from "../props/index.ts";

export class RenderContextCanvas extends RenderContextBase {
  private canvas: GMLCanvas;
  private canvasContext: GMLCanvasContext;
  constructor(...args: [string] | [number, number]) {
    super();
    this.canvas = createCanvas(...args);
    const context = getCanvasContext(this.canvas);
    if (!context) {
      throw new Error("Failed to get canvas 2D context.");
    }
    this.canvasContext = context;
  }
  private get _canvas() {
    if (!this.canvas) {
      throw new Error("Canvas is not initialized.");
    }
    return this.canvas;
  }
  private get _canvasContext() {
    if (!this.canvasContext) {
      throw new Error("Canvas context is not initialized.");
    }
    return this.canvasContext;
  }
  get width() {
    return this._canvas.width;
  }
  get height() {
    return this._canvas.height;
  }
  set width(value) {
    this._canvas.width = value;
  }
  set height(value) {
    this._canvas.height = value;
  }
  beginPath() {
    this._canvasContext.beginPath();
  }
  closePath() {
    this._canvasContext.closePath();
  }
  moveTo(x: number, y: number) {
    this._canvasContext.moveTo(x, y);
  }
  lineTo(x: number, y: number) {
    this._canvasContext.lineTo(x, y);
  }
  fill() {
    this._canvasContext.fill();
  }
  stroke() {
    this._canvasContext.stroke();
  }
  clear(color?: string) {
    const canvas = this._canvas;
    if (color === undefined) {
      this._canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      this._canvasContext.lineWidth = 0;
      this._canvasContext.fillStyle = color;
      this._canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  setRenderProps(props: Partial<RenderProps>) {
    Object.entries(props).forEach(([key, value]) => {
      // @ts-expect-error TODO: validate
      this._canvasContext[key] = value;
    });
  }
  toDataURL(type: "jpeg" | "png" | "gif" | "webp" | "avif", quality?: number): string {
    return this._canvas.toDataURL(`image/${type}`, quality);
  }
}
