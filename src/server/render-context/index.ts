import type { RenderContextBase, RenderContextDimensions } from "../../render/context.ts";
import { RenderContextNodeCanvas } from "./node-canvas.ts";
import { RenderContextSkiaCanvas } from "./skia-canvas.ts";

export { RenderContextNodeCanvas } from "./node-canvas.ts";
export { RenderContextSkiaCanvas } from "./skia-canvas.ts";

export interface RenderContextNodeCanvasOptions extends RenderContextDimensions {
  type: "node-canvas";
}

export interface RenderContextSkiaCanvasOptions extends RenderContextDimensions {
  type: "skia-canvas";
}

export type ServerRenderContextOptions =
  | RenderContextNodeCanvasOptions
  | RenderContextSkiaCanvasOptions;
export type ServerRenderContextType = ServerRenderContextOptions["type"];

export class ServerRenderContext {
  static createRenderContext(this: void, options: ServerRenderContextOptions): RenderContextBase;
  static createRenderContext(
    this: void,
    type: ServerRenderContextType,
    width: number,
    height: number,
  ): RenderContextBase;
  static createRenderContext(
    this: void,
    optionsOrType: ServerRenderContextType | ServerRenderContextOptions,
    width?: number,
    height?: number,
  ): RenderContextBase {
    const type = typeof optionsOrType === "string" ? optionsOrType : optionsOrType.type;
    const w = typeof optionsOrType === "string" ? width! : optionsOrType.width;
    const h = typeof optionsOrType === "string" ? height! : optionsOrType.height;
    switch (type) {
      case "node-canvas":
        return new RenderContextNodeCanvas(w, h);
      case "skia-canvas":
        return new RenderContextSkiaCanvas(w, h);
      default:
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid render context type "${type}"`);
    }
  }
}
