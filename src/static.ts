import { GML } from "gmljs";
import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import type { RenderContextBase, RenderImageFormat } from "./render/context.ts";
import type { RenderOptions } from "./render/options.ts";

export interface RenderStaticOptions extends RenderOptions {
  /** Animation position to render, 0–1 (default 1: the finished drawing). */
  position: number;
  /** Encoder quality for lossy formats, 0–1. */
  quality: number;
  format: RenderImageFormat;
}

export async function renderStatic(
  gml: string | GML,
  context: RenderContextBase,
  options: Partial<RenderStaticOptions> = {},
): Promise<ArrayBuffer> {
  const { format = "jpeg", position = 1, quality } = options;

  const view = new GMLView(gml, new GMLRenderer(context));
  view.setRenderOptions(options);
  view.setPosition(position);
  view.draw();

  return context.renderToArrayBuffer({ type: format, quality });
}
