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


  /* setCanvas(canvas) {
    if (this.canvas) {
      this.canvas.unload();
    }
    this.canvas = new Canvas(canvas);
    this.canvas.on(Canvas.EVENT_RESIZE, this._onResize, this);
    this.clientEnvironment = new ClientEnvironment(this.canvas.width, this.canvas.height);
  }
  _onResize(bounds){
    // ClientEnvironment is shared with so many objects inside renderer
    // it's easier to just create a new object. Probably not so efficient.
    this.clientEnvironment.setScreenBoundsValues(bounds.width, bounds.height);
    this.renderer.setClientEnvironment(this.clientEnvironment);
  } */
}