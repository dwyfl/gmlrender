import { GML } from "gmljs";
import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import type { RenderContextBase, RenderImageFormat } from "./render/context.ts";
import { RenderItemDrips, RenderItemTags } from "./render/item/index.ts";

export interface RenderStaticOptions {
  position: number;
  quality: number;
  background: string;
  color: string;
  /** Multiplies every stroke's line width; brush widths from the GML document are kept. */
  brushSizeMultiplier: number;
  drips: boolean;
  dripFactor: number;
  format: RenderImageFormat;
}

export function renderStatic(
  gml: string | GML,
  context: RenderContextBase,
  options: Partial<RenderStaticOptions> = {},
): Promise<ArrayBuffer> {
  const {
    format = "jpeg",
    position = 1,
    quality,
    background,
    color,
    brushSizeMultiplier,
    drips,
    dripFactor,
  } = options;

  const gmlInstance = typeof gml === "string" ? new GML(gml) : gml;
  const view = new GMLView(gmlInstance, new GMLRenderer(context));

  if (background) {
    view.setRenderItemProps("background", { fillStyle: background });
  }
  if (color) {
    // Tags and drips are drawn with stroke(), so the color must go to strokeStyle.
    view.setRenderItemProps("tags", { strokeStyle: color });
    view.setRenderItemProps("drips", { strokeStyle: color });
  }
  if (brushSizeMultiplier !== undefined) {
    const tags = view.getRenderItem("tags")?.item;
    if (tags instanceof RenderItemTags) {
      tags.setOptions({ brushSizeMultiplier });
    }
  }

  if (drips) {
    view.setRenderItemVisible("drips", true);
    const dripsItem = view.getRenderItem("drips")?.item;
    if (dripFactor !== undefined && dripsItem instanceof RenderItemDrips) {
      dripsItem.setOptions({ dripFactor });
    }
  }

  view.setPosition(position ?? 1);
  view.draw();

  return context.renderToArrayBuffer({ type: format, quality });
}
