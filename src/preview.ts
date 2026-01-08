import { GMLView } from "./view";
import { GMLRenderer } from "./render";
import { RenderContextCanvas } from "./render/context";
import { createCanvas, getCanvasContext, GMLCanvas } from "./isomorphic/canvas";
import { GML } from "gmljs";

const DEFAULT_BACKGROUND_COLOR: string | null = null;
const DEFAULT_JPEG_QUALITY = 0.6;

export class Preview {
  private gml: GML;
  private canvas: GMLCanvas;
  private imageData: Record<string, string>;
  private jpegQuality: number;
  private backgroundColor: string | null;
  private progress: number;

  constructor(gml: GML, width: number, height: number, progress: number = 1) {
    this.gml = gml;
    this.canvas = createCanvas(width, height);
    this.imageData = {};
    this.jpegQuality = DEFAULT_JPEG_QUALITY;
    this.backgroundColor = DEFAULT_BACKGROUND_COLOR;
    this.progress = Math.min(Math.max(progress, 0), 1);
  }
  setBackgroundColor(value: string | null) {
    this.backgroundColor = value;
    this.imageData = {};
  }
  setProgress(value: number) {
    this.progress = Math.min(Math.max(parseFloat(String(value)), 0), 1);
    this.imageData = {};
  }
  setJpegQuality(value: number) {
    this.jpegQuality = Math.min(Math.max(parseFloat(String(value)), 0), 1);
    delete this.imageData["image/jpeg"];
  }
  getPreview(imageType: string = "image/jpeg"): string {
    if (!this.imageData[imageType]) {
      this.imageData[imageType] = this._render(imageType);
    }
    return this.imageData[imageType];
  }
  _render(imageType: string): string {
    const renderContext = new RenderContextCanvas(this.canvas.width, this.canvas.height);
    const renderer = new GMLRenderer(renderContext);
    const gmlView = new GMLView(this.gml, renderer);
    gmlView.setProgress(this.progress);
    gmlView._draw();
    if (this.backgroundColor) {
      const context = getCanvasContext(this.canvas);
      if (context) {
        context.globalCompositeOperation = "destination-over";
        context.fillStyle = `#${this.backgroundColor}`;
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
    return this.canvas.toDataURL(imageType, this.jpegQuality);
  }
}
