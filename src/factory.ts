import { GML } from "gmljs";
import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import { renderStatic, type RenderStaticOptions } from "./static.ts";
import type { RenderContextBase, RenderContextDimensions } from "./render/context.ts";

export type GenericRenderContextType = string;
export type GenericRenderContextOptions<Type extends GenericRenderContextType> =
  RenderContextDimensions & { type: Type };
export type GenericRenderStaticOptions<Type extends GenericRenderContextType> =
  Partial<RenderStaticOptions> & GenericRenderContextOptions<Type>;
export type RenderContextFactoryFn<
  Type extends GenericRenderContextType,
  Options extends GenericRenderContextOptions<Type> = GenericRenderContextOptions<Type>,
> = ((options: Options) => RenderContextBase) &
  ((type: Type, width: number, height: number) => RenderContextBase);

export function createGMLImageFactory<
  Type extends GenericRenderContextType,
  Options extends GenericRenderStaticOptions<Type>,
>(contextFactoryFn: RenderContextFactoryFn<Type, Options>) {
  function factory(gml: string | GML, options: Options): Promise<ArrayBuffer>;
  function factory(
    gml: string | GML,
    type: Type,
    width: number,
    height: number,
    options?: Partial<RenderStaticOptions>,
  ): Promise<ArrayBuffer>;
  function factory(
    gml: string | GML,
    optionsOrType: Type | Options,
    width?: number,
    height?: number,
    options?: Partial<RenderStaticOptions>,
  ): Promise<ArrayBuffer> {
    const opts = typeof optionsOrType === "string" ? options : optionsOrType;
    const ctx =
      typeof optionsOrType === "string"
        ? contextFactoryFn(optionsOrType, width!, height!)
        : contextFactoryFn(optionsOrType);
    return renderStatic(gml, ctx, opts);
  }
  return factory;
}

export function createGMLViewFactory<
  Type extends GenericRenderContextType,
  Options extends GenericRenderContextOptions<Type>,
>(contextFactoryFn: RenderContextFactoryFn<Type, Options>) {
  function factory(gml: string | GML, options: Options): GMLView;
  function factory(gml: string | GML, type: Type, width: number, height: number): GMLView;
  function factory(
    gml: string | GML,
    optionsOrType: Type | Options,
    width?: number,
    height?: number,
  ): GMLView {
    const ctx =
      typeof optionsOrType === "string"
        ? contextFactoryFn(optionsOrType, width!, height!)
        : contextFactoryFn(optionsOrType);
    return new GMLView(gml, new GMLRenderer(ctx));
  }
  return factory;
}
