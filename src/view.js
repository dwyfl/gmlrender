import GML from 'gmljs';
import Timeline from './timeline';
import { GML_WINDOW } from './util/isomorphic';
import { RenderItemBackground, RenderItemTags, RenderItemDrips } from './render/item';

export default class View {
  constructor(gml, renderer){
    this.gml = null;
    this.renderer = null;
    this.timeline = null;
    this.animationRequest = null;
    if (gml !== undefined) {
      this.setGml(gml);
    }
    if (renderer !== undefined) {
      this.setRenderer(renderer);
    }
  }
  setGml(gml){
    if (!gml) {
      throw new Error('Not a GML object.');
    }
    if (typeof gml === 'string') {
      this.gml = new GML(gml);
    } else {
      this.gml = gml;
    }
    if (this.timeline) {
      this.timeline.unload();
    }
    this.timeline = new Timeline(this.gml);
  }
  setRenderer(renderer) {
    this.renderer = renderer;
    this.renderer.addRenderItems([
      new RenderItemBackground(this.gml),
      new RenderItemTags(this.gml),
      new RenderItemDrips(this.gml),
    ]);
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
    this._cancelAnimationFrame();
    this.gml = null;
    if (this.timeline) {
      this.timeline.unload();
      this.timeline = null;
    }
    if (this.renderer) {
      this.renderer.unload();
      this.renderer = null;
    }
  }
  setLoop(value){
    this.timeline.setLoop(value);
  }
  setSpeed(value){
    this.timeline.setSpeed(value);
  }
  setRotation(value){
    this.renderer.setRotation(value);
  }
  setScale(value){
    this.renderer.setScale(value);
  }
  setOffset(x, y){
    this.renderer.setOffsetValues(x, y);
  }
  _draw(){
    this.renderer.render(this.timeline.getState());
  }
  _requestAnimationFrame() {
    this.animationRequest = GML_WINDOW.requestAnimationFrame(() => {
      this._draw();
      this._requestAnimationFrame();
    });
  }
  _cancelAnimationFrame() {
    if (this.animationRequest)
      GML_WINDOW.cancelAnimationFrame(this.animationRequest);
    this.animationRequest = null;
  }
}