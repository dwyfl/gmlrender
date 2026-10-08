import {
  BrowserRenderContext,
  type BrowserRenderContextOptions,
} from "./render-context/index.ts";
import { type RenderStaticOptions } from "../static.ts";
import { createGMLImageFactory, createGMLViewFactory } from "../factory.ts";

export * from "./render-context/index.ts";
export * from "./render-to-video.ts";

export type BrowserRenderStaticOptions = Partial<RenderStaticOptions> &
  BrowserRenderContextOptions;

export const createGMLImage =
  createGMLImageFactory<BrowserRenderContextOptions>(
    BrowserRenderContext.createRenderContext,
  );

export const createGMLView = createGMLViewFactory<BrowserRenderContextOptions>(
  BrowserRenderContext.createRenderContext,
);
