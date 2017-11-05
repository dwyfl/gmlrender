import View from './view';
import Renderer from './render';
import RenderContextCanvas from './render/context';

const DEFAULT_BACKGROUND_COLOR = '#fff';
const DEFAULT_JPEG_QUALITY = 0.6;

export default class Preview {
  constructor(gml, width, height){
    this.gml = gml;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
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
    // Insert setTimeout(() => {}, 0) ?
    const context = this.canvas.getContext('2d');
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = DEFAULT_BACKGROUND_COLOR;
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    return this.canvas.toDataURL(imageType, DEFAULT_JPEG_QUALITY);
  }
}