import View from './view';
import Renderer from './render';
import RenderContextCanvas from './render/context';
import { GML_DOCUMENT } from './util/isomorphic';

const DEFAULT_BACKGROUND_COLOR = null;
const DEFAULT_JPEG_QUALITY = 0.6;

export default class Preview {
  constructor(gml, width, height){
    this.gml = gml;
    this.canvas = GML_DOCUMENT.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.imageData = null;
    this.jpegQuality = DEFAULT_JPEG_QUALITY;
    this.backgroundColor = DEFAULT_BACKGROUND_COLOR;
  }
  setBackgroundColor(value) {
    this.backgroundColor = value;
    this.imageData = null;
  }
  setJpegQuality(value) {
    this.jpegQuality = Math.min(Math.max(parseFloat(value), 0), 1);
    this.imageData = null;
  }
  getPreview(imageType = 'image/jpeg'){
    if (!this.imageData) {
      this.imageData = this._render(imageType);
    }
    return this.imageData;
  }
  _render(imageType){
    const renderContext = new RenderContextCanvas(this.canvas);
    const renderer = new Renderer(renderContext);
    const gmlView = new View(this.gml, renderer);
    gmlView.setProgress(1);
    gmlView._draw();
    if (this.backgroundColor) {
      const context = this.canvas.getContext('2d');
      context.globalCompositeOperation = 'destination-over';
      context.fillStyle = `#${this.backgroundColor}`;
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    return this.canvas.toDataURL(imageType, this.jpegQuality);
  }
}