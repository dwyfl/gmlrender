import {GML} from 'gmljs';
import {vec3, mat3} from 'gl-matrix';
import Renderer from './renderer';
import Timeline from './timeline';
import Canvas from './canvas';
import {ClientEnvironment} from './environment';

export default class View {
	constructor(gml, canvas){
		this.gml = null;
		this.canvas = null;
		this.renderer = null;
		this.timeline = new Timeline();
		this.clientEnvironment = new ClientEnvironment();
		this.animationRequest = null;
		// Init
		if (typeof(canvas) !== 'undefined') {
			this.setCanvas(canvas);
		}
		if (typeof(gml) !== 'undefined') {
			this.setGml(gml);
		}
	}
	setCanvas(canvas) {
		if (this.canvas) {
			this.canvas.unload();
		}
		this.canvas = new Canvas(canvas);
		this.canvas.on(Canvas.EVENT_RESIZE, this._onResize, this);
		this.clientEnvironment = new ClientEnvironment(this.canvas.width, this.canvas.height);
	}
	setGml(gml){
		if (typeof(gml) == 'string') {
			this.gml = new GML(gml);
		} else if (gml && gml instanceof GML) {
			this.gml = gml;
		} else {
			throw new Error('Not a GML object.');
		}
		if (!this.canvas) {
			this.setCanvas();
		}
		this.renderer = new Renderer(this.gml, this.canvas, this.clientEnvironment);
		this.timeline.unload();
		this.timeline = new Timeline(this.gml);
	}
	setIndex(index, time){
		this.timeline.setIndex(index, time);
	}
	setProgress(value){
		value = Math.min(1, Math.max(0, value));
		const time = this.timeline.getTotalTime() * value;
		const index = this.timeline.getIndex(time);
		this.timeline.setIndex(index, time);
	}
	togglePlay(){
		if (this.timeline.isRunning()) {
			this.stop();
		} else if (this.currentIndex >= this.timeline.getLastIndex()) {
			this.restart();
		} else {
			this.start();
		}
	}
	restart(){
		this.timeline.setIndex(0, 0);
		this.timeline.start();
	}
	start(){
		this.timeline.start();
		this._requestAnimationFrame();
	}
	stop(){
		this.timeline.stop();
		this._cancelAnimationFrame();
	}
	unload(){
		this.gml = null;
		this.renderer.unload();
		this.renderer = null;
		if (this.canvas) {
			this.canvas.unload();
			this.canvas = null;
		}
		if (this.timeline) {
			this.timeline.unload();
			this.timeline = new Timeline();
		}
	}
	setLoop(value){
		this.timeline.setLoop(value);
	}
	setSpeed(value){
		this.timeline.setSpeed(value);
	}
	setRotation(value){
		this.clientEnvironment.setRotation(value);
	}
	setScale(value){
		this.clientEnvironment.setScale(value);
	}
	setOffset(x, y){
		this.clientEnvironment.setOffsetValues(x, y);
	}
	_onResize(bounds){
		// ClientEnvironment is shared with so many objects inside renderer
		// it's easier to just create a new object. Probably not so efficient.
		this.clientEnvironment.setScreenBoundsValues(bounds.width, bounds.height);
		this.renderer.unload();
		this.renderer = new Renderer(this.gml, this.canvas, this.clientEnvironment);
	}
	_draw(){
		this.renderer.render(this.timeline.getState());
		this._requestAnimationFrame();
	}
	_requestAnimationFrame() {
		this.animationRequest = window.requestAnimationFrame(this._draw.bind(this));
	}
	_cancelAnimationFrame() {
		if (this.animationRequest)
			window.cancelAnimationFrame(this.animationRequest);
		this.animationRequest = null;
	}
}