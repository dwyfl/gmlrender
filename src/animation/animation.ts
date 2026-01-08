import { GML } from "gmljs";
import { GMLTagTimeline, GMLTagTimelineFrame, GMLTimeline } from "./timeline";
import {
  GML_cancelAnimationFrame,
  GML_clearTimeout,
  GML_requestAnimationFrame,
  GML_setTimeout,
  GML_time,
} from "../isomorphic/time";

export interface GMLAnimationState {
  timeline: GMLTagTimeline;
  frame: GMLTagTimelineFrame | undefined;
  frameIndex: number;
  time: number;
  totalFrames: number;
  totalTime: number;
}

export class GMLAnimation extends EventTarget {
  private static readonly DEFAULT_RESTART_DELAY = 1000;

  static readonly EVENT_START = "start";
  static readonly EVENT_STOP = "stop";
  static readonly EVENT_UPDATE = "update";

  timelines: GMLTagTimeline[] = [];
  lastStepTime: number;
  restartTimeout: number | null;
  animationRequest: number | null;

  // State
  currentTag: number;
  currentIndex: number;
  currentTime: number;
  running: boolean;

  // Settings
  speed: number;
  loop: boolean;
  restartDelay: number;

  constructor(gml: GML) {
    super();
    this.timelines = new GMLTimeline(gml).timelines;
    this.lastStepTime = 0;
    this.restartTimeout = null;
    this.animationRequest = null;
    // State vars
    this.currentTag = 0;
    this.currentIndex = 0;
    this.currentTime = 0;
    this.running = false;
    // Settings
    this.restartDelay = GMLAnimation.DEFAULT_RESTART_DELAY;
    this.speed = 1;
    this.loop = true;
  }

  private get timeline() {
    return this.timelines[this.currentTag];
  }

  unload() {
    this.timelines = [];
    this.currentTag = 0;
    this.currentIndex = 0;
    this.currentTime = 0;
    this.cancelStep();
    this.cancelRestart();
  }

  getState() {
    return {
      timeline: this.timeline,
      frame: this.currentFrame,
      frameIndex: this.currentIndex,
      time: this.currentTime,
      totalFrames: this.timeline.length,
      totalTime: this.totalTime,
    } satisfies GMLAnimationState;
  }

  get isRunning() {
    return this.running;
  }

  get isEmpty() {
    return this.timeline.length === 0;
  }

  get lastIndex() {
    return Math.max(0, this.timeline.length - 1);
  }

  get totalTime() {
    return this.isEmpty ? 0 : this.getTime(this.lastIndex);
  }

  get currentFrame() {
    return this.getFrame(this.currentIndex);
  }

  getFrame(index?: number): GMLTagTimelineFrame | undefined {
    return this.timeline[
      Math.max(0, Math.min(this.lastIndex, index ?? this.currentIndex))
    ];
  }

  getTime(index?: number) {
    if (index === undefined) {
      return this.currentTime;
    }
    return this.getFrame(index)?.t ?? 0;
  }

  getIndex(time?: number) {
    if (time === undefined) {
      return this.currentIndex;
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

  setIndex(index?: number, time?: number) {
    const sameIndex = this.currentIndex === index || index === undefined;
    const sameTime = this.currentTime === time || time === undefined;
    if (sameIndex && sameTime) {
      return;
    }
    if (this.isEmpty) {
      this.currentIndex = 0;
      this.currentTime = 0;
    } else {
      index = Math.min(Math.max(index ?? 0, 0), this.lastIndex);
      const indexTime = this.getTime(index);
      const nextIndexTime = this.getTime(index + 1);
      this.currentIndex = index;
      this.currentTime =
        time === undefined
          ? this.getTime(index)
          : Math.min(Math.max(time, indexTime), nextIndexTime);
    }
    this.dispatchEvent(
      new CustomEvent(GMLAnimation.EVENT_UPDATE, { detail: this.getState() })
    );
  }

  setTag(value: number) {
    this.currentTag = Math.max(0, Math.max(this.timelines.length - 1, value));
  }

  setLoop(value: boolean) {
    this.loop = !!value;
  }

  setSpeed(value: number) {
    this.speed = isNaN(value) ? 1.0 : Math.max(0, Math.min(100, value));
  }

  start() {
    if (this.isEmpty) {
      return;
    }
    this.cancelRestart();
    this.lastStepTime = GML_time();
    this.running = true;
    this.scheduleAnimationFrame();
    this.dispatchEvent(
      new CustomEvent(GMLAnimation.EVENT_START, { detail: this.getState() })
    );
  }

  private scheduleAnimationFrame() {
    this.animationRequest = GML_requestAnimationFrame(this.step.bind(this));
  }

  pause() {
    this.cancelStep();
  }

  stop() {
    this.complete();
  }

  private cancelRestart() {
    if (this.restartTimeout) {
      GML_clearTimeout(this.restartTimeout);
    }
    this.restartTimeout = null;
  }

  private cancelStep() {
    if (this.animationRequest) {
      GML_cancelAnimationFrame(this.animationRequest);
    }
    this.animationRequest = null;
    this.running = false;
    this.dispatchEvent(
      new CustomEvent(GMLAnimation.EVENT_STOP, { detail: this.getState() })
    );
  }

  private step(time: number) {
    let shouldUpdate = false;
    let deltaTime = time - this.lastStepTime;
    let lastIndex = this.lastIndex;
    let nextTime;
    this.lastStepTime = time;
    this.currentTime += deltaTime * 0.001 * this.speed;
    while (this.currentIndex < lastIndex) {
      nextTime = this.getTime(this.currentIndex + 1);
      if (this.currentTime < nextTime) break;
      this.currentIndex++;
      shouldUpdate = true;
    }
    if (shouldUpdate) {
      this.dispatchEvent(
        new CustomEvent(GMLAnimation.EVENT_UPDATE, { detail: this.getState() })
      );
    }
    if (this.currentIndex >= this.lastIndex) {
      this.complete(this.loop);
    }
    if (this.running) {
      this.scheduleAnimationFrame();
    }
  }

  private complete(scheduleRestart = false) {
    this.cancelStep();
    if (scheduleRestart) {
      this.restartTimeout = GML_setTimeout(() => {
        this.currentIndex = 0;
        this.currentTime = 0;
        this.start();
      }, this.restartDelay);
    }
  }
}
