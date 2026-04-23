import { GML } from "gmljs";
import { GMLViewStatic, type GMLViewStaticOptions } from "../view-static.ts";
import { RenderContextNodeCanvas } from "./render-context/node-canvas.ts";
import { RenderContextSkiaCanvas } from "./render-context/skia-canvas.ts";
import { GMLView } from "../view.ts";
import { GMLRenderer } from "../render/index.ts";

export function createGMLViewStatic(
  gml: string | GML,
  width: number,
  height: number,
  type: "canvas" | "skia",
  options?: Partial<Omit<GMLViewStaticOptions, "width" | "height">>,
) {
  return new GMLViewStatic(
    typeof gml === "string" ? new GML(gml) : gml,
    {
      canvas: () => new RenderContextNodeCanvas(width, height),
      skia: () => new RenderContextSkiaCanvas(width, height),
    }[type](),
    {
      ...options,
      width,
      height,
    },
  );
}

export function createGMLView(
  gml: string | GML,
  width: number,
  height: number,
  type: "canvas" | "skia",
  options?: Partial<{ position: number; background: string }>,
) {
  const { position, background } = options ?? {};
  const view = new GMLView(
    typeof gml === "string" ? new GML(gml) : gml,
    new GMLRenderer(
      {
        canvas: () => new RenderContextNodeCanvas(width, height),
        skia: () => new RenderContextSkiaCanvas(width, height),
      }[type](),
    ),
  );
  if (background) {
    view.setBackgroundRenderProps({ fillStyle: background });
  }
  if (position) {
    view.setPosition(position);
  }
  return view;
}
