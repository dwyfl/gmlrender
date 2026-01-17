import { GMLView } from "./view";
import { GMLRenderer } from "./render";
import { RenderContextCanvas } from "./render/context";
import { getCanvasContext } from "./isomorphic/canvas";
import { GML } from "gmljs";

const DEFAULT_BACKGROUND_COLOR: string | null = null;
const DEFAULT_JPEG_QUALITY = 0.6;

export class Preview {
  private gml: GML;
  private imageData: Record<string, string>;
  private jpegQuality: number;
  private backgroundColor: string | null;
  private progress: number;
  private width: number;
  private height: number;

  constructor(gml: GML, width: number, height: number, progress: number = 1) {
    this.gml = gml;
    this.imageData = {};
    this.jpegQuality = DEFAULT_JPEG_QUALITY;
    this.backgroundColor = DEFAULT_BACKGROUND_COLOR;
    this.progress = Math.min(Math.max(progress, 0), 1);
    this.width = width;
    this.height = height;
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
    const renderContext = new RenderContextCanvas(this.width, this.height);
    const renderer = new GMLRenderer(renderContext);
    const gmlView = new GMLView(this.gml, renderer);
    gmlView.setProgress(this.progress);
    gmlView.draw();
    // if (this.backgroundColor) {
    //   renderContext.setRenderProps({
    //     compositeOperation: "destination-over",
    //     fillStyle: `#${this.backgroundColor}`,
    //   });
    //   renderContext.fillStyle = `#${this.backgroundColor}`;
    //   renderContext.fillRect(0, 0, renderContext.width, renderContext.height);
    // }
    return renderContext.toDataURL(imageType, this.jpegQuality);
  }
}
