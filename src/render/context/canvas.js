import RenderContextBase from './base';
import { GML_DOCUMENT } from '../../util/isomorphic';

export default class RenderContextCanvas extends RenderContextBase {
  constructor(canvas) {
    super();
    this.canvas = null;
    this.canvasContext = null;
    this.init(canvas);
  }
  _canvas() {
    if (this.canvas) {
      return this.canvas;
    }
    throw new Error('Canvas is not initialized.');
  }
  _canvasContext() {
    if (this.canvasContext) {
      return this.canvasContext;
    }
    throw new Error('Canvas context is not initialized.');
  }
  init(canvas){
    if (typeof canvas === 'string') {
      this.canvas = GML_DOCUMENT.getElementById(canvas);
    } else if (canvas) { // canvas instanceof Element
      this.canvas = canvas;
    } else {
      this.canvas = GML_DOCUMENT.createElement('canvas');
      this.canvas.width = 1024;
      this.canvas.height = 768;
    }
    if (!this.canvas) { // !(canvas instanceof Element)
      throw new Error('Unable to init canvas.');
    }
    this.canvasContext = this.canvas.getContext('2d');
  }
  unload() {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.canvasContext = null;
    this.removeAllListeners();
  }
  expandToClientWidth() {
    if (!this.canvas) {
      return false;
    }
    if (this.canvas.width != this.canvas.clientWidth) {
      this.canvas.width = this.canvas.clientWidth;
      return true;
    }
    if (this.canvas.height != this.canvas.clientHeight) {
      this.canvas.height = this.canvas.clientHeight;
      return true;
    }
    return false;
  }
  get width() {
    return this._canvas().width;
  }
  get height() {
    return this._canvas().height;
  }
  set width(value) {
    this._canvas().width = value;
  }
  set height(value) {
    this._canvas().height = value;
  }
  beginPath() {
    this._canvasContext().beginPath();
  }
  closePath() {
    this._canvasContext().closePath();
  }
  moveTo(x, y) {
    this._canvasContext().moveTo(x, y);
  }
  lineTo(x, y) {
    this._canvasContext().lineTo(x, y);
  }
  fill() {
    this._canvasContext().fill();
  }
  clear(color) {
    const canvas = this._canvas();
    if (color === undefined) {
      this._canvasContext().clearRect(0, 0, canvas.width, canvas.height);
    }
    else {
      this._canvasContext().lineWidth = 0;
      this._canvasContext().fillStyle = color;
      this._canvasContext().fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  setRenderProps(renderProps) {
    Object.keys(renderProps).forEach(key => {
      this._canvasContext()[key] = renderProps[key];
    });
  }
}