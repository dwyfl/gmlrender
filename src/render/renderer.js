import ClientEnvironment from '../environment/client';
import RenderState from './state';

export default class Renderer {
  constructor(context) {
    this.clientEnvironment = new ClientEnvironment(context.width, context.height);
    this.renderContext = context;
    this.renderItems = [];
    this.renderState = new RenderState();
    this.renderState.clientEnvironment = this.clientEnvironment;
  }
  unload() {
    if (this.renderContext) {
      this.renderContext.unload();
    }
    this.renderContext = null;
    this.renderItems = [];
    this.renderState = null;
    this.clientEnvironment = null;
  }
  addRenderItem(item, index = null, visible = true) {
    this.renderItems.splice(
      index === null ? this.renderItems.length : index,
      0,
      {item, visible}
    );
  }
  addRenderItems(items) {
    items.forEach(item => this.addRenderItem(item));
  }
  removeRenderItem(index) {
    this.renderItems.splice(index, 1);
  }
  render(state) {
    this.renderState.timelineState = state;
    this.renderContext.clear();
    this.renderItems.forEach(renderItem => {
      if (renderItem.visible) {
        this.renderContext.setRenderProps(renderItem.item.getRenderProps());
        renderItem.item.render(this.renderContext, this.renderState);
      }
    });
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
  setLineWidth(value){
    this.renderState.setRenderOption('lineWidth', Math.min(Math.max(parseFloat(value), 0), 1));
  }
}