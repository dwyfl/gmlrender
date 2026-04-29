import { GML } from "gmljs";
import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import type { RenderContextBase, RenderImageFormat } from "./render/context.ts";
import type { RenderItemDrips } from "./render/item/drips.ts";

export interface RenderStaticOptions {
  position: number;
  quality: number;
  background: string;
  drips: boolean;
  dripFactor: number;
  format: RenderImageFormat;
}

export function renderStatic(
  gml: string | GML,
  context: RenderContextBase,
  options: Partial<RenderStaticOptions> = {},
): Promise<ArrayBuffer> {
  const { format = "jpeg", position = 1, quality, background, drips, dripFactor } = options;

  const view = new GMLView(typeof gml === "string" ? new GML(gml) : gml, new GMLRenderer(context));

  if (background) {
    view.setRenderItemProps("background", { fillStyle: background });
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
