import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import {
  RenderContextBase,
  RenderContextCanvas,
  type RenderFormat,
} from "./render/context/index.ts";
import { GML } from "gmljs";
import { clamp } from "./util.ts";

const DEFAULT_QUALITY = 0.6;

export interface GMLViewStaticOptions {
  width: number;
  height: number;
  position: number;
  quality: number;
  background: string;
  ctx: RenderContextBase;
}

export class GMLViewStatic {
  private gml: GML;
  private ctx: RenderContextBase;
  private imageData: Partial<Record<RenderFormat, string>>;
  private quality: number;
  private position: number;
  private width: number;
  private height: number;
  private background: string | undefined;

  constructor(gml: GML, options?: Partial<GMLViewStaticOptions>) {
    this.gml = gml;
    this.imageData = {};

    const {
      width = 640,
      height = 480,
      position = 1,
      quality = DEFAULT_QUALITY,
      background,
      ctx,
    } = options ?? {};
    this.position = clamp(position, 0, 1);
    this.quality = clamp(quality, 0, 1);
    this.width = width;
    this.height = height;
    this.background = background;
    this.ctx = ctx ? ctx : new RenderContextCanvas(width, height);
  }
  setSize(width: number, height: number) {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.imageData = {};
    }
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
  render(format: RenderFormat = "jpeg"): string {
    if (!this.imageData[format]) {
      this.imageData[format] = this.renderToDataURL(format);
    }
    return this.imageData[format];
  }
  private renderToDataURL(format: RenderFormat): string {
    const view = new GMLView(this.gml, new GMLRenderer(this.ctx));
    if (this.background) {
      view.setBackgroundRenderProps({ fillStyle: this.background });
    }
    view.setPosition(this.position);
    view.draw();
    return this.ctx.toDataURL(format, this.quality);
  }
}
