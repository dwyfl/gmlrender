import { GMLView } from "./view.ts";
import { GMLRenderer } from "./render/index.ts";
import { RenderContextBase, RenderContextCanvas } from "./render/context/index.ts";
import { GML } from "gmljs";

const DEFAULT_QUALITY = 0.6;

export type PreviewType = "jpeg" | "png" | "gif" | "webp" | "avif";
export interface PreviewOptions {
  width: number;
  height: number;
  progress: number;
  quality: number;
  background: string;
  ctx: RenderContextBase;
}

export class Preview {
  private gml: GML;
  private ctx: RenderContextBase;
  private imageData: Record<string, string>;
  private quality: number;
  private progress: number;
  private width: number;
  private height: number;
  private background: string | undefined;

  constructor(gml: GML, options?: Partial<PreviewOptions>) {
    this.gml = gml;
    this.imageData = {};

    const {
      width = 640,
      height = 480,
      progress = 1,
      quality = DEFAULT_QUALITY,
      background,
      ctx,
    } = options ?? {};
    this.progress = Math.min(Math.max(progress, 0), 1);
    this.quality = Math.min(Math.max(quality, 0), 1);
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
  setProgress(value: number) {
    if (this.progress !== value) {
      this.progress = Math.min(Math.max(value, 0), 1);
      this.imageData = {};
    }
  }
  setQuality(value: number) {
    if (this.quality !== value) {
      this.quality = Math.min(Math.max(value, 0), 1);
      this.imageData = {};
    }
  }
  getPreview(type: PreviewType = "jpeg"): string {
    if (!this.imageData[type]) {
      this.imageData[type] = this._render(type);
    }
    return this.imageData[type];
  }
  _render(type: PreviewType): string {
    const view = new GMLView(this.gml, new GMLRenderer(this.ctx));
    if (this.background) {
      view.setBackgroundRenderProps({ fillStyle: this.background });
    }
    view.setProgress(this.progress);
    view.draw();
    return this.ctx.toDataURL(type, this.quality);
  }
}
