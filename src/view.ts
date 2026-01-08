import { GML } from "gmljs";
import { GMLRenderer } from "./render";
import { EventEmitter } from "eventemitter3";
import { GMLAnimation } from "./animation/animation";
import {
  GML_requestAnimationFrame,
  GML_cancelAnimationFrame,
} from "./isomorphic/time";
import {
  RenderItemBackground,
  RenderItemTags,
  RenderItemDrips,
} from "./render/item";

export const GMLViewEvents = {
  START: "start",
  STOP: "stop",
} as const;

export type GMLViewEventType =
  (typeof GMLViewEvents)[keyof typeof GMLViewEvents];

export class GMLView extends EventEmitter {
  private _gml: GML | undefined;
  private _renderer: GMLRenderer | undefined;
  private _timeline: GMLAnimation | undefined;
  private animationRequest: number | null = null;

  constructor(gml?: GML, renderer?: GMLRenderer) {
    super();
    this._gml = undefined;
    this._renderer = undefined;
    this._timeline = undefined;
    this.animationRequest = null;
    if (gml !== undefined) {
      this.setGml(gml);
    }
    if (renderer !== undefined) {
      this.setRenderer(renderer);
    }
  }

  static get EVENT_START() {
    return GMLViewEvents.START;
  }
  static get EVENT_STOP() {
    return GMLViewEvents.STOP;
  }

  setGml(gml: GML | string) {
    if (!gml) {
      throw new Error("Not a GML object.");
    }
    if (typeof gml === "string") {
      this._gml = new GML(gml);
    } else {
      this._gml = gml;
    }
    if (this._timeline) {
      this._timeline.unload();
    }
    this._timeline = new GMLAnimation(this._gml);
    this._timeline.addEventListener(GMLAnimation.EVENT_START, (event) =>
      this.emit(GMLViewEvents.START, event)
    );
    this._timeline.addEventListener(GMLAnimation.EVENT_STOP, (event) =>
      this.emit(GMLViewEvents.STOP, event)
    );
  }

  setRenderer(renderer: GMLRenderer) {
    this._renderer = renderer;
    if (this._gml) {
      this._renderer.addRenderItems([
        new RenderItemBackground(this._gml),
        new RenderItemTags(this._gml),
        new RenderItemDrips(this._gml),
      ]);
    }
  }

  getRenderer() {
    return this._renderer;
  }

  getRenderContext() {
    return this._renderer ? this._renderer.renderContext : null;
  }

  getRenderItems() {
    return this._renderer ? this._renderer.renderItems : [];
  }

  getState() {
    if (!this._timeline) {
      throw new Error("Timeline not initialized");
    }
    return this._timeline.getState();
  }

  setIndex(index: number, time?: number) {
    if (!this._timeline) {
      throw new Error("Timeline not initialized");
    }
    this._timeline.setIndex(index, time);
  }

  setProgress(value: number) {
    if (!this._timeline) {
      throw new Error("Timeline not initialized");
    }
    value = Math.min(1, Math.max(0, value));
    const time = this._timeline.totalTime * value;
    const index = this._timeline.getIndex(time);
    this._timeline.setIndex(index, time);
  }

  isPlaying() {
    return this._timeline ? this._timeline.isRunning : false;
  }

  togglePlay() {
    if (!this._timeline) return;
    if (this.isPlaying()) {
      this.stop();
    } else if (this._timeline.currentIndex >= this._timeline.lastIndex) {
      this.restart();
    } else {
      this.start();
    }
  }

  restart() {
    if (!this._timeline) return;
    this._timeline.setIndex(0, 0);
    this._timeline.start();
  }

  start() {
    if (!this._timeline) return;
    this._timeline.start();
    this._requestAnimationFrame();
  }

  stop() {
    if (!this._timeline) return;
    this._timeline.stop();
    this._cancelAnimationFrame();
  }

  unload() {
    this._cancelAnimationFrame();
    this.removeAllListeners();
    this._gml = undefined;
    if (this._timeline) {
      this._timeline.unload();
      this._timeline = undefined;
    }
    if (this._renderer) {
      this._renderer.unload();
      this._renderer = undefined;
    }
  }

  setLoop(value: boolean) {
    if (!this._timeline) return;
    this._timeline.setLoop(value);
  }

  setSpeed(value: number) {
    if (!this._timeline) return;
    this._timeline.setSpeed(value);
  }

  setRotation(value: number) {
    if (!this._renderer) return;
    this._renderer.setRotation(value);
  }

  setScale(value: number) {
    if (!this._renderer) return;
    this._renderer.setScale(value);
  }

  setOffset(x: number, y: number) {
    if (!this._renderer) return;
    this._renderer.setOffset(x, y);
  }

  _draw() {
    if (!this._renderer || !this._timeline) return;
    this._renderer.render(this._timeline.getState());
  }

  _requestAnimationFrame() {
    this.animationRequest = GML_requestAnimationFrame(() => {
      this._draw();
      this._requestAnimationFrame();
    });
  }

  _cancelAnimationFrame() {
    if (this.animationRequest)
      GML_cancelAnimationFrame(this.animationRequest);
    this.animationRequest = null;
  }
}
