import { RenderContextBase } from "../../src/render/context/base.ts";
import type { RenderProps } from "../../src/render/props/index.ts";

// Discriminated union of every canvas API call the render pipeline can make.
export type Call =
  | { type: "beginPath" }
  | { type: "closePath" }
  | { type: "fill" }
  | { type: "stroke" }
  | { type: "clear"; color: string | undefined }
  | { type: "moveTo"; x: number; y: number }
  | { type: "lineTo"; x: number; y: number }
  | { type: "setRenderProps"; props: Partial<RenderProps> };

/**
 * A mock RenderContextBase that records every canvas API call.
 * Use `ctx.only("moveTo")` to filter by call type with proper typing.
 */
export class MockContext extends RenderContextBase {
  private _w: number;
  private _h: number;
  calls: Call[] = [];

  constructor(width = 320, height = 240) {
    super();
    this._w = width;
    this._h = height;
  }

  get width() {
    return this._w;
  }
  set width(v: number) {
    this._w = v;
  }
  get height() {
    return this._h;
  }
  set height(v: number) {
    this._h = v;
  }

  beginPath() {
    this.calls.push({ type: "beginPath" });
  }
  closePath() {
    this.calls.push({ type: "closePath" });
  }
  fill() {
    this.calls.push({ type: "fill" });
  }
  stroke() {
    this.calls.push({ type: "stroke" });
  }
  clear(color?: string) {
    this.calls.push({ type: "clear", color });
  }
  moveTo(x: number, y: number) {
    this.calls.push({ type: "moveTo", x, y });
  }
  lineTo(x: number, y: number) {
    this.calls.push({ type: "lineTo", x, y });
  }
  setRenderProps(props: Partial<RenderProps>) {
    this.calls.push({ type: "setRenderProps", props: { ...props } });
  }
  toDataURL(_type: string, _quality?: number): string {
    return "data:image/png;base64,";
  }

  reset() {
    this.calls = [];
  }

  /** Return all calls of a given type with full type narrowing. */
  only<T extends Call["type"]>(type: T): Extract<Call, { type: T }>[] {
    return this.calls.filter((c): c is Extract<Call, { type: T }> => c.type === type);
  }
}
