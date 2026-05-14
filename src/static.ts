import { GML } from "gmljs";
import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import type { RenderContextBase, RenderImageFormat } from "./render/context.ts";
import type { RenderItemDrips } from "./render/item/drips.ts";

export interface RenderStaticOptions {
  position: number;
  quality: number;
  background: string;
  color: string;
  brushSize: number;
  drips: boolean;
  dripFactor: number;
  format: RenderImageFormat;
}

export function renderStatic(
  doc: string | GML,
  context: RenderContextBase,
  options: Partial<RenderStaticOptions> = {},
): Promise<ArrayBuffer> {
  const {
    format = "jpeg",
    position = 1,
    quality,
    background,
    color,
    brushSize,
    drips,
    dripFactor,
  } = options;

  const gml = typeof doc === "string" ? new GML(doc) : doc;
  const view = new GMLView(gml, new GMLRenderer(context));

  if (background) {
    view.setRenderItemProps("background", { fillStyle: background });
  }
  if (color) {
    view.setRenderItemProps("tags", { fillStyle: color });
  }
  if (brushSize) {
    view.setRenderItemProps("tags", { lineWidth: brushSize });
  }

  if (drips) {
    view.setRenderItemVisible("drips", true);
    if (dripFactor !== undefined) {
      const drips = view.getRenderItem("drips")?.item as RenderItemDrips;
      drips.setOptions({ dripFactor });
    }
  }

  view.setPosition(position ?? 1);
  view.draw();

  return context.renderToArrayBuffer({ type: format, quality });
}
