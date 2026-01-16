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
  private _animation: GMLAnimation | undefined;
  private animationRequest: number | null = null;

  constructor(gml?: GML, renderer?: GMLRenderer) {
    super();
    this._gml = undefined;
    this._renderer = undefined;
    this._animation = undefined;
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
    if (this._animation) {
      this._animation.unload();
    }
    this._animation = new GMLAnimation(this._gml);
    this._animation.addEventListener(GMLAnimation.EVENT_START, (event) =>
      this.emit(GMLViewEvents.START, event)
    );
    this._animation.addEventListener(GMLAnimation.EVENT_STOP, (event) =>
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
    if (!this._animation) {
      throw new Error("Timeline not initialized");
    }
    return this._animation.getState();
  }

  setIndex(index: number, time?: number) {
    if (!this._animation) {
      throw new Error("Timeline not initialized");
    }
    this._animation.setIndex(index, time);
  }

  setProgress(value: number) {
    if (!this._animation) {
      throw new Error("Timeline not initialized");
    }
    value = Math.min(1, Math.max(0, value));
    const time = this._animation.totalTime * value;
    const index = this._animation.getIndex(time);
    this._animation.setIndex(index, time);
  }

  isPlaying() {
    return this._animation ? this._animation.isRunning : false;
  }

  togglePlay() {
    if (!this._animation) return;
    if (this.isPlaying()) {
      this.stop();
    } else if (this._animation.currentIndex >= this._animation.lastIndex) {
      this.restart();
    } else {
      this.start();
    }
  }

  restart() {
    if (!this._animation) return;
    this._animation.setIndex(0, 0);
    this._animation.start();
  }

  start() {
    if (!this._animation) return;
    this._animation.start();
    this._requestAnimationFrame();
  }

  stop() {
    if (!this._animation) return;
    this._animation.stop();
    this._cancelAnimationFrame();
  }

  unload() {
    this._cancelAnimationFrame();
    this.removeAllListeners();
    this._gml = undefined;
    if (this._animation) {
      this._animation.unload();
      this._animation = undefined;
    }
    if (this._renderer) {
      this._renderer.unload();
      this._renderer = undefined;
    }
  }

  setLoop(value: boolean) {
    if (!this._animation) return;
    this._animation.setLoop(value);
  }

  setSpeed(value: number) {
    if (!this._animation) return;
    this._animation.setSpeed(value);
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
    if (!this._renderer || !this._animation) return;
    this._renderer.render(this._animation.getState());
  }

  _requestAnimationFrame() {
    this.animationRequest = GML_requestAnimationFrame(() => {
      this._draw();
      this._requestAnimationFrame();
    });
  }

  _cancelAnimationFrame() {
    if (this.animationRequest) GML_cancelAnimationFrame(this.animationRequest);
    this.animationRequest = null;
  }
}
