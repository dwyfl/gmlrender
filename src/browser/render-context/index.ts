import type { RenderContextBase, RenderContextDimensions } from "../../render/context.ts";
import { RenderContextHtmlCanvas } from "./html-canvas.ts";
import { RenderContextOffscreenCanvas } from "./offscreen-canvas.ts";

export { RenderContextHtmlCanvas } from "./html-canvas.ts";
export { RenderContextOffscreenCanvas } from "./offscreen-canvas.ts";

export interface RenderContextOffscreenCanvasOptions extends RenderContextDimensions {
  type: "offscreen-canvas";
}

export interface RenderContextHtmlCanvasOptions extends RenderContextDimensions {
  type: "html-canvas";
  canvas?: HTMLCanvasElement;
}

export type BrowserRenderContextOptions =
  | RenderContextOffscreenCanvasOptions
  | RenderContextHtmlCanvasOptions;
export type BrowserRenderContextType = BrowserRenderContextOptions["type"];

export class BrowserRenderContext {
  static createRenderContext(options: BrowserRenderContextOptions): RenderContextBase;
  static createRenderContext(
    type: BrowserRenderContextType,
    width: number,
    height: number,
  ): RenderContextBase;
  static createRenderContext(
    optionsOrType: BrowserRenderContextType | BrowserRenderContextOptions,
    width?: number,
    height?: number,
  ): RenderContextBase {
    const type = typeof optionsOrType === "string" ? optionsOrType : optionsOrType.type;
    const w = typeof optionsOrType === "string" ? width! : optionsOrType.width;
    const h = typeof optionsOrType === "string" ? height! : optionsOrType.height;
    switch (type) {
      case "html-canvas":
        return typeof optionsOrType !== "string" &&
          optionsOrType.type === "html-canvas" &&
          optionsOrType.canvas
          ? new RenderContextHtmlCanvas(optionsOrType.canvas)
          : new RenderContextHtmlCanvas(w, h);
      case "offscreen-canvas":
        return new RenderContextOffscreenCanvas(w, h);
      default:
        throw new Error(`Invalid render context type "${type}"`);
    }
  }
}
