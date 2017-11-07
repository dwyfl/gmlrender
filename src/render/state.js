export default class RenderState {
  constructor() {
    this.timelineState = null;
    this.clientEnvironment = null;
    this.renderOptions = {};
  }
  setRenderOptions(renderOptions) {
    Object.keys(renderOptions).forEach(key => {
      this.renderOptions[key] = renderOptions[key];
    });
  }
  setRenderOption(key, value) {
    this.renderOptions[key] = value;
  }
  getRenderOption(key) {
    return this.renderOptions[key];
  }
  hasRenderOption(key) {
    this.renderOptions[key] !== undefined;
  }
}