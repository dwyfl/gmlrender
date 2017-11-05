import { EventEmitter } from 'eventemitter3';

const EVENT_RESIZE = 'event_resize';

export default class RenderContextBase extends EventEmitter {
  constructor() {
    super();
  }
  static get EVENT_RESIZE() {
    return EVENT_RESIZE;
  }
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  fill() {}
  clear() {}
  setRenderProps(renderProps) {} // eslint-disable-line no-unused-vars
}