import { GML } from "gmljs";
import { type GMLTagTimeline, type GMLTagTimelineFrame, GMLTimeline } from "./timeline.ts";
import {
  GML_cancelAnimationFrame,
  GML_clearTimeout,
  GML_requestAnimationFrame,
  GML_setTimeout,
  GML_time,
} from "../isomorphic/time.ts";
import { clamp } from "../util.ts";

export interface GMLAnimationState {
  timeline: GMLTagTimeline;
  frame: GMLTagTimelineFrame | undefined;
  frameIndex: number;
  time: number;
  totalFrames: number;
  totalTime: number;
}

export type GMLAnimationEvent =
  | typeof GMLAnimation.EVENT_START
  | typeof GMLAnimation.EVENT_STOP
  | typeof GMLAnimation.EVENT_UPDATE
  | typeof GMLAnimation.EVENT_RESTART;

export class GMLAnimation extends EventTarget {
  private static readonly DEFAULT_RESTART_DELAY = 1000;

  static readonly EVENT_START = "start";
  static readonly EVENT_STOP = "stop";
  static readonly EVENT_RESTART = "restart";
  static readonly EVENT_UPDATE = "update"; // dispatched on every new frame

  addEventListener<K extends GMLAnimationEvent>(
    type: K,
    listener: (event: CustomEvent<GMLAnimationState>) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(type: string, listener: any, options?: any): void {
    super.addEventListener(type, listener, options);
  }

  removeEventListener<K extends GMLAnimationEvent>(
    type: K,
    listener: (event: CustomEvent<GMLAnimationState>) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(type: string, listener: any, options?: any): void {
    super.removeEventListener(type, listener, options);
  }

  private timelines: GMLTagTimeline[] = [];
  private lastStepTime: number;
  private restartTimeout: number | null;
  private animationRequest: number | null;

  // State
  private _tag: number;
  private _frame: number;
  private _time: number;
  private _isPlaying: boolean;

  // Settings
  private _speed: number;
  private _loop: boolean;
  private _restartDelay: number;

  constructor(gml: GML) {
    super();
    this.timelines = new GMLTimeline(gml).timelines;
    this.lastStepTime = 0;
    this.restartTimeout = null;
    this.animationRequest = null;
    // State vars
    this._tag = 0;
    this._frame = 0;
    this._time = 0;
    this._isPlaying = false;
    // Settings
    this._restartDelay = GMLAnimation.DEFAULT_RESTART_DELAY;
    this._speed = 1;
    this._loop = true;
  }

  private get timeline(): GMLTagTimeline {
    return this.timelines[this._tag];
  }

  unload() {
    this._tag = 0;
    this._frame = 0;
    this._time = 0;
    this.cancelRestart();
    this.cancelAnimation();
  }

  getState() {
    return {
      timeline: this.timeline,
      frame: this.currentFrame,
      frameIndex: this._frame,
      time: this._time,
      totalFrames: this.timeline.length,
      totalTime: this.totalTime,
    } satisfies GMLAnimationState;
  }

  get tag() {
    return this._tag;
  }

  get frame() {
    return this._frame;
  }

  get time() {
    return this._time;
  }

  get speed() {
    return this._speed;
  }

  get isPlaying() {
    return this._isPlaying;
  }

  get isLooping() {
    return this._loop;
  }

  get isEmpty() {
    return this.timeline.length === 0;
  }

  get lastFrameIndex() {
    return Math.max(0, this.timeline.length - 1);
  }

  get totalTime() {
    return this.isEmpty ? 0 : this.getFrameTime(this.lastFrameIndex);
  }

  get currentFrame() {
    return this.getFrame(this._frame);
  }

  getFrame(frame: number): GMLTagTimelineFrame | undefined {
    const index = clamp(frame, 0, this.lastFrameIndex);
    return this.timeline[index];
  }

  getFrameTime(frame: number) {
    return this.getFrame(frame)?.t ?? 0;
  }

  getFrameIndex(time?: number) {
    if (time === undefined) {
      return this._frame;
    }
    let index;
    for (index = 0; index < this.timeline.length; ++index) {
      if (this.timeline[index].t > time) {
        --index;
        break;
      }
    }
    return index;
  }

  setFrame(frame: number, time?: number) {
    const sameFrame = this._frame === frame || frame === undefined;
    const sameTime = this._time === time || time === undefined;
    if (sameFrame && sameTime) {
      return;
    }
    if (this.isEmpty) {
      this._frame = 0;
      this._time = 0;
    } else {
      const newFrame = clamp(frame, 0, this.lastFrameIndex);
      const newFrameTime = this.getFrameTime(newFrame);
      const newTime = clamp(time ?? newFrameTime, newFrameTime, this.getFrameTime(newFrame + 1));
      this._frame = newFrame;
      this._time = newTime;
    }
    this.dispatchEvent(new CustomEvent(GMLAnimation.EVENT_UPDATE, { detail: this.getState() }));
  }

  setTime(time: number) {
    this.setFrame(this.getFrameIndex(time), time);
  }

  setTag(value: number) {
    if (!this.timelines[value]) {
      throw new Error(`Invalid tag index ${value}`);
    }
    this._tag = value;
  }

  setLoop(value: boolean) {
    this._loop = value;
  }

  setSpeed(value: number) {
    this._speed = clamp(value, 0.01, 100);
  }

  start() {
    if (this.isEmpty) {
      return;
    }
    this.cancelRestart();
    this.cancelAnimation();
    if (this._frame === this.lastFrameIndex) {
      this._frame = 0;
      this._time = 0;
    }
    this._isPlaying = true;
    this.lastStepTime = GML_time();
    this.requestAnimationFrame();
    this.dispatchEvent(new CustomEvent(GMLAnimation.EVENT_START, { detail: this.getState() }));
  }

  stop() {
    this.cancelRestart();
    this.cancelAnimation();
    this._isPlaying = false;
    this.dispatchEvent(new CustomEvent(GMLAnimation.EVENT_STOP, { detail: this.getState() }));
  }

  private requestAnimationFrame() {
    this.animationRequest = GML_requestAnimationFrame(this.step.bind(this));
  }

  private scheduleRestart(delay?: number) {
    this.cancelRestart();
    this.cancelAnimation();
    this.restartTimeout = GML_setTimeout(() => {
      this._frame = 0;
      this._time = 0;
      this.lastStepTime = GML_time();
      this.requestAnimationFrame();
      this.dispatchEvent(
        new CustomEvent(GMLAnimation.EVENT_RESTART, {
          detail: this.getState(),
        }),
      );
    }, delay ?? this._restartDelay);
  }

  private cancelRestart() {
    if (this.restartTimeout) {
      GML_clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
  }

  private cancelAnimation() {
    if (this.animationRequest) {
      GML_cancelAnimationFrame(this.animationRequest);
      this.animationRequest = null;
    }
  }

  private step(time: number) {
    let shouldUpdate = false;
    const deltaTime = time - this.lastStepTime;
    const lastIndex = this.lastFrameIndex;
    let nextTime;
    this.lastStepTime = time;
    this._time += deltaTime * 0.001 * this._speed;
    while (this._frame < lastIndex) {
      nextTime = this.getFrameTime(this._frame + 1);
      if (this._time < nextTime) break;
      this._frame++;
      shouldUpdate = true;
    }
    if (shouldUpdate) {
      this.dispatchEvent(new CustomEvent(GMLAnimation.EVENT_UPDATE, { detail: this.getState() }));
    }
    if (this._frame >= this.lastFrameIndex) {
      this.scheduleRestart();
    } else if (this._isPlaying) {
      this.requestAnimationFrame();
    }
  }
}
