import { GML } from "gmljs";
import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import { renderStatic, type RenderStaticOptions } from "./static.ts";
import type { RenderContextBase, RenderContextOptions } from "./render/context.ts";

export type RenderContextFactoryFn<Options extends RenderContextOptions> = (
  options: Options,
) => RenderContextBase;

export function createGMLImageFactory<Options extends RenderContextOptions>(
  contextFactoryFn: RenderContextFactoryFn<Options>,
) {
  return function createGMLImage(
    gml: string | GML,
    options: Options & Partial<RenderStaticOptions>,
  ): Promise<ArrayBuffer> {
    return renderStatic(gml, contextFactoryFn(options), options);
  };
}

export function createGMLViewFactory<Options extends RenderContextOptions>(
  contextFactoryFn: RenderContextFactoryFn<Options>,
) {
  return function createGMLView(gml: string | GML, options: Options): GMLView {
    return new GMLView(gml, new GMLRenderer(contextFactoryFn(options)));
  };
}
