import {
  ServerRenderContext,
  type ServerRenderContextOptions,
  type ServerRenderContextType,
} from "./render-context/index.ts";
import { type RenderStaticOptions } from "../static.ts";
import { createGMLImageFactory, createGMLViewFactory } from "../factory.ts";

export * from "./render-context/index.ts";

export type ServerRenderStaticOptions = Partial<RenderStaticOptions> & ServerRenderContextOptions;

export const createGMLImage = createGMLImageFactory<
  ServerRenderContextType,
  ServerRenderStaticOptions
>(ServerRenderContext.createRenderContext);

export const createGMLView = createGMLViewFactory<
  ServerRenderContextType,
  ServerRenderContextOptions
>(ServerRenderContext.createRenderContext);
