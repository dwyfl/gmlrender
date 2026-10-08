import type {
  RenderContextBase,
  RenderContextDimensions,
} from "../../render/context.ts";
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
  static createRenderContext(
    this: void,
    options: ServerRenderContextOptions,
  ): RenderContextBase {
    switch (options.type) {
      case "node-canvas":
        return new RenderContextNodeCanvas(options.width, options.height);
      case "skia-canvas":
        return new RenderContextSkiaCanvas(options.width, options.height);
      default:
        throw new Error(
          `Invalid render context type "${String((options as { type: unknown }).type)}"`,
        );
    }
  }
}
