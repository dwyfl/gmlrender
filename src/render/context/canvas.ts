import { RenderContextBase } from "./base";
import {
  createCanvas,
  getCanvasContext,
  GMLCanvas,
  GMLCanvasContext,
} from "../../isomorphic/canvas";
import { RenderProps } from "../props";

export class RenderContextCanvas extends RenderContextBase {
  private canvas: GMLCanvas | null;
  private canvasContext: GMLCanvasContext | null;
  constructor(...args: [string] | [number, number]) {
    super();
    this.canvas = null;
    this.canvasContext = null;
    this.init(...args);
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
  init(...args: [string] | [number, number]) {
    this.canvas = createCanvas(...args);
    this.canvasContext = getCanvasContext(this.canvas);
  }
  unload() {
    this.canvas = null;
    this.canvasContext = null;
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
}
