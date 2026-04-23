import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import { GML } from "gmljs";
import { clamp } from "./util.ts";
import type { RenderProps } from "./render/props/index.ts";
import type { RenderContextBase, RenderImageFormat } from "./render/context.ts";

const DEFAULT_QUALITY = 0.6;

export interface GMLViewStaticOptions {
  position: number;
  quality: number;
  background: string;
  renderProps: Partial<RenderProps>;
}

export class GMLViewStatic {
  private gml: GML;
  private ctx: RenderContextBase;
  private imageData: Partial<Record<RenderImageFormat, Blob>>;
  private quality: number;
  private position: number;
  private background: string | undefined;

  constructor(gml: GML, context: RenderContextBase, options?: Partial<GMLViewStaticOptions>) {
    this.gml = gml;
    this.imageData = {};

    const { position = 1, quality = DEFAULT_QUALITY, background, renderProps } = options ?? {};

    this.position = clamp(position, 0, 1);
    this.quality = clamp(quality, 0, 1);
    this.background = background;
    this.ctx = context;

    if (renderProps) {
      this.ctx.setRenderProps(renderProps);
    }
  }

  get renderContext(): RenderContextBase {
    return this.ctx;
  }

  setPosition(value: number) {
    if (this.position !== value) {
      this.position = clamp(value, 0, 1);
      this.imageData = {};
    }
  }

  setQuality(value: number) {
    if (this.quality !== value) {
      this.quality = clamp(value, 0, 1);
      this.imageData = {};
    }
  }

  async render(format: RenderImageFormat = "jpeg"): Promise<Blob> {
    if (!this.imageData[format]) {
      this.imageData[format] = await this.renderToBlob(format);
    }
    return this.imageData[format]!;
  }

  private async renderToBlob(format: RenderImageFormat): Promise<Blob> {
    const view = new GMLView(this.gml, new GMLRenderer(this.ctx));
    if (this.background) {
      view.setBackgroundRenderProps({ fillStyle: this.background });
    }
    view.setPosition(this.position);
    view.draw();
    return this.ctx.renderToBlob({ type: format, quality: this.quality });
  }
}
