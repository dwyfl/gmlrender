import {
  BrowserRenderContext,
  type BrowserRenderContextOptions,
  type BrowserRenderContextType,
} from "./render-context/index.ts";
import { type RenderStaticOptions } from "../static.ts";
import { createGMLImageFactory, createGMLViewFactory } from "../factory.ts";

export * from "./render-context/index.ts";
export * from "./render-to-video.ts";

export type BrowserRenderStaticOptions = Partial<RenderStaticOptions> & BrowserRenderContextOptions;

export const createGMLImage = createGMLImageFactory<
  BrowserRenderContextType,
  BrowserRenderStaticOptions
>(BrowserRenderContext.createRenderContext);

export const createGMLView = createGMLViewFactory<
  BrowserRenderContextType,
  BrowserRenderContextOptions
>(BrowserRenderContext.createRenderContext);
