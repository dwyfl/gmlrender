import { EventEmitter } from 'eventemitter3';
import { GML_WINDOW, GML_TIME } from '../util/isomorphic';
import GMLTimeline from './gml';

const EVENT_START = 'event_start';
const EVENT_STOP = 'event_stop';
const EVENT_UPDATE = 'event_update';

const GML_RESTART_DELAY = 1000;

export default class Timeline extends EventEmitter {
  constructor(gml) {
    super();
    this.gmlTimeline = new GMLTimeline(gml);
    this.timelines = this.gmlTimeline.getTimeline();
    this.timeline = 0; // Only support one tag/timeline at a time
    // State vars
    this.currentIndex = 0;
    this.currentTime = 0;
    this.lastStepTime = 0;
    this.restartDelay = GML_RESTART_DELAY;
    this.scheduledRestart = null;
    this.animationRequest = null;
    this.running = false;
    // Settings
    this.speed = 1;
    this.loop = true;
  }
  static get EVENT_START() {
    return EVENT_START;
  }
  static get EVENT_STOP() {
    return EVENT_STOP;
  }
  static get EVENT_UPDATE() {
    return EVENT_UPDATE;
  }
  get _timeline() {
    return this.timelines[this.timeline];
  }
  get length() {
    return this._timeline.length;
  }
  setTimeline(value) {
    this.timeline = Math.min(Math.max(value, 0), this.timesline.length - 1);
  }
  unload() {
    this.gmlTimeline = null;
    this.timelines = null;
    this.removeAllListeners();
  }
  getState() {
    return {
      timeline: this._timeline,
      frame: this.getFrame(this.currentIndex),
      frameIndex: this.currentIndex,
      time: this.currentTime,
      totalFrames: this._timeline.length,
      totalTime: this.getTotalTime()
    };
  }
  isRunning() {
    return this.running;
  }
  isEmpty() {
    return this._timeline.length === 0;
  }
  getLastIndex() {
    return Math.max(0, this._timeline.length - 1);
  }
  getTotalTime() {
    return this.isEmpty() ? 0 : this.getTime(this.getLastIndex());
  }
  getFrames() {
    return this._timeline;
  }
  getFrame(index) {
    if (index === undefined) {
      index = this.currentIndex;
    }
    index = Math.max(0, Math.min(this.getLastIndex(), index));
    return this.isEmpty() ? null : this._timeline[index];
  }
  getTime(index) {
    if (index === undefined) {
      return this.currentTime;
    }
    const frame = this.getFrame(index);
    return frame === null ? 0 : frame.t;
  }
  getIndex(time) {
    if (time === undefined) {
      return this.currentIndex;
    }
    let index;
    for (index = 0; index < this._timeline.length; ++index) {
      if (time < this._timeline[index].t){
        --index;
        break;
      }
    }
    return Math.max(0, Math.min(index, this._timeline.length));
  }
  setIndex(index, time) {
    const sameIndex = this.currentIndex === index || index === undefined;
    const sameTime = this.currentTime === time || time === undefined;
    if (sameIndex && sameTime) {
      return;
    }
    if (this.isEmpty()) {
      this.currentIndex = 0;
      this.currentTime = 0;
    } else {
      index = Math.min(Math.max(index, 0), this.getLastIndex());
      const indexTime = this.getTime(index);
      const nextIndexTime = this.getTime(index + 1);
      this.currentIndex = index;
      this.currentTime = time === undefined
        ? this.getTime(index)
        : Math.min(Math.max(time, indexTime), nextIndexTime);
    }
    this.emit(EVENT_UPDATE, this.getState());
  }
  setLoop(value) {
    this.loop = !!value;
  }
  setSpeed(value) {
    this.speed = isNaN(value) ? 1.0 : Math.max(0, Math.min(100, value));
  }
  start() {
    this._run();
  }
  stop() {
    this._runComplete(false);
  }
  _cancelRestart() {
    if (this.scheduledRestart)
      clearTimeout(this.scheduledRestart);
    this.scheduledRestart = null;
  }
  _cancelStep() {
    if (this.animationRequest)
      GML_WINDOW.cancelAnimationFrame(this.animationRequest);
    this.animationRequest = null;
  }
  _run() {
    if (this.isEmpty())
      return;
    this._cancelRestart();
    this.lastStepTime = GML_TIME();
    this.running = true;
    this.animationRequest = GML_WINDOW.requestAnimationFrame(this._runStep.bind(this));
    this.emit(EVENT_START, this.getState());
  }
  _runStep(time) {
    let shouldUpdate = false;
    let deltaTime = time - this.lastStepTime;
    let lastIndex = this.getLastIndex();
    let nextTime;
    this.lastStepTime = time;
    this.currentTime += deltaTime * 0.001 * this.speed;
    while (this.currentIndex < lastIndex) {
      nextTime = this.getTime(this.currentIndex + 1);
      if (this.currentTime < nextTime)
        break;
      this.currentIndex++;
      shouldUpdate = true;
    }
    if (shouldUpdate) {
      this.emit(EVENT_UPDATE, this.getState());
    }
    if (this.currentIndex >= this.getLastIndex()) {
      this._runComplete(this.loop);
    }
    if (this.running) {
      this.animationRequest = GML_WINDOW.requestAnimationFrame(this._runStep.bind(this));
    }
  }
  _runComplete(scheduleRestart) {
    if (scheduleRestart === undefined)
      scheduleRestart = true;
    this._cancelStep();
    this.running = false;
    if (this.loop && scheduleRestart) {
      this.scheduledRestart = setTimeout(() => {
        this.currentIndex = 0;
        this.currentTime = 0;
        this.start();
      }, GML_RESTART_DELAY);
    }
    this.emit(EVENT_STOP, this.getState());
  }
}
