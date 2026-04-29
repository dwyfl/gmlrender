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
export type RenderContextFactoryFn<Type extends GenericRenderContextType> = (
  type: Type,
  width: number,
  height: number,
) => RenderContextBase;

export function createGMLImageFactory<
  Type extends GenericRenderContextType,
  Options extends GenericRenderStaticOptions<Type>,
>(contextFactoryFn: RenderContextFactoryFn<Type>) {
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
    const type = typeof optionsOrType === "string" ? optionsOrType : optionsOrType.type;
    const w = typeof optionsOrType === "string" ? width! : optionsOrType.width;
    const h = typeof optionsOrType === "string" ? height! : optionsOrType.height;
    const opts = typeof optionsOrType === "string" ? options : optionsOrType;
    const ctx = contextFactoryFn(type, w, h);
    return renderStatic(gml, ctx, opts);
  }
  return factory;
}

export function createGMLViewFactory<
  Type extends GenericRenderContextType,
  Options extends GenericRenderContextOptions<Type>,
>(contextFactoryFn: RenderContextFactoryFn<Type>) {
  function factory(gml: string | GML, options: Options): GMLView;
  function factory(gml: string | GML, type: Type, width: number, height: number): GMLView;
  function factory(
    gml: string | GML,
    optionsOrType: Type | Options,
    width?: number,
    height?: number,
  ): GMLView {
    const type = typeof optionsOrType === "string" ? optionsOrType : optionsOrType.type;
    const w = typeof optionsOrType === "string" ? width! : optionsOrType.width;
    const h = typeof optionsOrType === "string" ? height! : optionsOrType.height;
    const ctx = contextFactoryFn(type, w, h);
    return new GMLView(gml, new GMLRenderer(ctx));
  }
  return factory;
}
