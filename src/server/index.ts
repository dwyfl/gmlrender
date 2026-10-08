import {
  ServerRenderContext,
  type ServerRenderContextOptions,
} from "./render-context/index.ts";
import { type RenderStaticOptions } from "../static.ts";
import { createGMLImageFactory, createGMLViewFactory } from "../factory.ts";

export * from "./render-context/index.ts";

export type ServerRenderStaticOptions = Partial<RenderStaticOptions> &
  ServerRenderContextOptions;

export const createGMLImage = createGMLImageFactory<ServerRenderContextOptions>(
  ServerRenderContext.createRenderContext,
);

export const createGMLView = createGMLViewFactory<ServerRenderContextOptions>(
  ServerRenderContext.createRenderContext,
);
