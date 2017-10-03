import {EventEmitter} from 'eventemitter3';

const EVENT_RESIZE = 'event_resize';

export default class Canvas extends EventEmitter {
	constructor(canvas) {
		super();
		// Canvas element and context
		this.canvas = null;
		this.canvasContext = null;
		// User defined variables
		this.canvasFillStyle = '#333';
		this.canvasStrokeStyle = '#333';
		this.canvasLineWidth = 3;
		this.canvasLineCap = 'round';
		this.canvasLineJoin = 'round';
		// Auto init
		this.init(canvas);
	}
	static get EVENT_RESIZE() {
		return EVENT_RESIZE;
	}
	_canvas() {
		if (this.canvas)
			return this.canvas;
		throw new Error('Canvas is not initialized.');
	}
	_canvasContext() {
		if (this.canvasContext)
			return this.canvasContext;
		throw new Error('Canvas context is not initialized.');
	}
	get width() {
		return this._canvas().width;
	}
	get height() {
		return this._canvas().height;
	}
	set width(value) {
		return this._canvas().width = value;
	}
	set height(value) {
		return this._canvas().height = value;
	}
	init(canvas){
		if (typeof(canvas) == 'string') {
			this.canvas = document.getElementById(canvas);
			if (!this.canvas) {
				throw new Error("Unable to find element with id: " + canvas);
			}
		} else if (typeof(canvas) != 'undefined' && canvas instanceof Element) {
			this.canvas = canvas;
		} else {
			this.canvas = document.createElement('canvas');
			this.canvas.width = 1024;
			this.canvas.height = 768;
			if (document.body.firstChild) {
				document.body.insertBefore(this.canvas, document.body.firstChild);
			} else {
				document.body.appendChild(this.canvas);
			}
		}
		if (this.canvas && this.canvas.getContext) {
			this.canvasContext = this.canvas.getContext('2d');
			this.windowResizeBinding = Canvas.prototype._handleWindowResize.bind(this);
			window.addEventListener('resize', this.windowResizeBinding, false);
			// This hack is mostly to get the GMLPreview to work
			setTimeout(this.windowResizeBinding, 0);
		} else {
			throw new Error('Unable to init canvas.');
		}
	}
	clear() {
		const canvas = this._canvas();
		this._canvasContext().clearRect(0, 0, canvas.width, canvas.height);
	}
	unload() {
		if (this.canvas) {
			this.canvas.parentElement.removeChild(this.canvas);
		}
		if (this.windowResizeBinding) {
			window.removeEventListener('resize', this.windowResizeBinding);
		}
		this.canvas = null;
		this.canvasContext = null;
		this.removeAllListeners();
	}
	_handleWindowResize(){
		let dirty = false;
		if (this.canvas.width != this.canvas.clientWidth) {
			this.canvas.width = this.canvas.clientWidth;
			dirty = true;
		}
		if (this.canvas.height != this.canvas.clientHeight) {
			this.canvas.height = this.canvas.clientHeight;
			dirty = true;
		}
		if (dirty) {
			this.emit(EVENT_RESIZE, {
				width: this.canvas.width,
				height: this.canvas.height
			});
		}
	}
	setCanvasContextProps(props) {
		const canvasContext = this._canvasContext();
		for (let i in props) {
			canvasContext[i] = props[i];
		}
	}
	setContextScreenBoundsDrawStyles(){
		this.setCanvasContextProps({
			fillStyle: '#fff',
			lineWidth: 0
		});
	}
	setContextTagDrawStyles(){
		this.setCanvasContextProps({
			fillStyle: this.canvasFillStyle,
			strokeStyle: this.canvasStrokeStyle,
			lineWidth: this.canvasLineWidth,
			lineCap: this.canvasLineCap,
			lineJoin: this.canvasLineJoin
		});
	}
	setContextDripDrawStyles(){
		this.setCanvasContextProps({
			strokeStyle: this.canvasStrokeStyle,
			lineWidth: this.canvasLineWidth * 0.75,
		});
	}
}