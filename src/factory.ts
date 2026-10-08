import { GML } from "gmljs";
import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import { renderStatic, type RenderStaticOptions } from "./static.ts";
import type { RenderOptions } from "./render/options.ts";
import type {
  RenderContextBase,
  RenderContextOptions,
} from "./render/context.ts";

export type RenderContextFactoryFn<Options extends RenderContextOptions> = (
  options: Options,
) => RenderContextBase;

export function createGMLImageFactory<Options extends RenderContextOptions>(
  contextFactoryFn: RenderContextFactoryFn<Options>,
) {
  return async function createGMLImage(
    gml: string | GML,
    options: Options & Partial<RenderStaticOptions>,
  ): Promise<ArrayBuffer> {
    return renderStatic(gml, contextFactoryFn(options), options);
  };
}

export function createGMLViewFactory<Options extends RenderContextOptions>(
  contextFactoryFn: RenderContextFactoryFn<Options>,
) {
  return function createGMLView(
    gml: string | GML,
    options: Options & Partial<RenderOptions>,
  ): GMLView {
    const view = new GMLView(gml, new GMLRenderer(contextFactoryFn(options)));
    view.setRenderOptions(options);
    return view;
  };
}
