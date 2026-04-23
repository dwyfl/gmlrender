import { GML } from "gmljs";
import { GMLViewStatic, type GMLViewStaticOptions } from "../view-static.ts";
import { GMLView } from "../view.ts";
import { GMLRenderer } from "../render/index.ts";
import {
  BrowserRenderContext,
  type BrowserRenderContextOptions,
  type BrowserRenderContextType,
} from "./render-context/index.ts";

export function createGMLViewStatic(
  gml: string | GML,
  renderOptions: BrowserRenderContextOptions,
  viewOptions?: Partial<GMLViewStaticOptions>,
): GMLViewStatic;
export function createGMLViewStatic(
  gml: string | GML,
  type: BrowserRenderContextType,
  width: number,
  height: number,
  viewOptions?: Partial<GMLViewStaticOptions>,
): GMLViewStatic;
export function createGMLViewStatic(
  gml: string | GML,
  optionsOrType: BrowserRenderContextType | BrowserRenderContextOptions,
  optionsOrWidth?: number | Partial<GMLViewStaticOptions>,
  height?: number,
  viewOptions?: Partial<GMLViewStaticOptions>,
): GMLViewStatic {
  const type = typeof optionsOrType === "string" ? optionsOrType : optionsOrType.type;
  const w = typeof optionsOrType === "string" ? (optionsOrWidth as number) : optionsOrType.width;
  const h = typeof optionsOrType === "string" ? height! : optionsOrType.height;
  const opts = typeof optionsOrWidth === "number" ? viewOptions : optionsOrWidth;
  return new GMLViewStatic(
    typeof gml === "string" ? new GML(gml) : gml,
    BrowserRenderContext.createRenderContext(type, w, h),
    opts,
  );
}

export function createGMLView(
  gml: string | GML,
  renderOptions: BrowserRenderContextOptions,
  viewOptions?: Partial<{ position: number; background: string }>,
): GMLView;
export function createGMLView(
  gml: string | GML,
  type: BrowserRenderContextType,
  width: number,
  height: number,
  viewOptions?: Partial<{ position: number; background: string }>,
): GMLView;
export function createGMLView(
  gml: string | GML,
  optionsOrType: BrowserRenderContextType | BrowserRenderContextOptions,
  optionsOrWidth?: number | Partial<GMLViewStaticOptions>,
  height?: number,
  viewOptions?: Partial<{ position: number; background: string }>,
): GMLView {
  const type = typeof optionsOrType === "string" ? optionsOrType : optionsOrType.type;
  const w = typeof optionsOrType === "string" ? (optionsOrWidth as number) : optionsOrType.width;
  const h = typeof optionsOrType === "string" ? height! : optionsOrType.height;
  const opts = typeof optionsOrWidth === "number" ? viewOptions : optionsOrWidth;
  const view = new GMLView(
    typeof gml === "string" ? new GML(gml) : gml,
    new GMLRenderer(BrowserRenderContext.createRenderContext(type, w, h)),
  );
  if (opts?.background) {
    view.setBackgroundRenderProps({ fillStyle: opts.background });
  }
  if (opts?.position) {
    view.setPosition(opts.position);
  }
  return view;
}
