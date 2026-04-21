import { GML } from "gmljs";
import { GMLRenderer } from "./render/index.ts";
import { GMLAnimation, type GMLAnimationState } from "./animation/animation.ts";
import { GML_requestAnimationFrame, GML_cancelAnimationFrame } from "./isomorphic/time.ts";
import { RenderItemBackground, RenderItemTags, RenderItemDrips } from "./render/item/index.ts";
import type { RenderProps } from "./render/props/index.ts";
import { clamp } from "./util.ts";

export type GMLViewEvent =
  | typeof GMLView.EVENT_START
  | typeof GMLView.EVENT_STOP
  | typeof GMLView.EVENT_RESTART;

export class GMLView extends EventTarget {
  static readonly EVENT_START = "start";
  static readonly EVENT_STOP = "stop";
  static readonly EVENT_RESTART = "restart";

  addEventListener<K extends GMLViewEvent>(
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

  removeEventListener<K extends GMLViewEvent>(
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

  private _gml: GML;
  private _renderer: GMLRenderer;
  private _animation: GMLAnimation;
  private _animationRequest: number | null = null;

  constructor(gml: GML | string, renderer: GMLRenderer) {
    super();

    this._gml = this._initGml(gml);
    this._animation = this._initAnimation(this._gml);
    this._renderer = renderer;
    this._initRenderer(this._initRenderItems(this._gml));
    this._animationRequest = null;
  }

  private get animation() {
    if (!this._animation) {
      throw new Error("GML not initialized");
    }
    return this._animation;
  }

  setGml(gml: GML | string) {
    this._gml = this._initGml(gml);
    this._animation = this._initAnimation(this._gml);
    this._initRenderer(this._initRenderItems(this._gml));
  }

  private _initGml(document: GML | string) {
    return typeof document === "string" ? new GML(document) : document;
  }

  private _initAnimation(gml: GML) {
    if (this._animation) {
      this._animation.unload();
      this._animation.removeEventListener(GMLAnimation.EVENT_START, this._animationEventHandler);
      this._animation.removeEventListener(GMLAnimation.EVENT_RESTART, this._animationEventHandler);
      this._animation.removeEventListener(GMLAnimation.EVENT_STOP, this._animationEventHandler);
    }
    const animation = new GMLAnimation(gml);
    animation.addEventListener(GMLAnimation.EVENT_START, this._animationEventHandler);
    animation.addEventListener(GMLAnimation.EVENT_RESTART, this._animationEventHandler);
    animation.addEventListener(GMLAnimation.EVENT_STOP, this._animationEventHandler);
    return animation;
  }

  private _animationEventHandler = (event: CustomEvent<GMLAnimationState>) => {
    const eventType = {
      [GMLAnimation.EVENT_START]: GMLView.EVENT_START,
      [GMLAnimation.EVENT_RESTART]: GMLView.EVENT_RESTART,
      [GMLAnimation.EVENT_STOP]: GMLView.EVENT_STOP,
    }[event.type];
    if (eventType) {
      this.dispatchEvent(new CustomEvent(eventType, { detail: event.detail }));
    }
  };

  private _initRenderer({
    renderItemBackground,
    renderItemTags,
    renderItemDrips,
  }: Partial<{
    renderItemBackground: RenderItemBackground;
    renderItemTags: RenderItemTags;
    renderItemDrips: RenderItemDrips;
  }> = {}) {
    this._renderer.unload();
    this._renderer.addRenderItems([
      ...(renderItemBackground ? [renderItemBackground] : []),
      ...(renderItemTags ? [renderItemTags] : []),
      ...(renderItemDrips ? [renderItemDrips] : []),
    ]);
  }

  private _initRenderItems(gml: GML) {
    const renderItemBackground = new RenderItemBackground(gml);
    const renderItemTags = new RenderItemTags(gml);
    const renderItemDrips = new RenderItemDrips(gml);
    return {
      renderItemBackground,
      renderItemTags,
      renderItemDrips,
    };
  }

  setRenderer(renderer: GMLRenderer) {
    this._renderer = renderer;
    this._initRenderer(this._initRenderItems(this._gml));
  }

  get renderer() {
    return this._renderer;
  }

  get renderContext() {
    return this._renderer.context;
  }

  get renderItems() {
    return this._renderer.items;
  }

  setBackgroundRenderProps(props: Partial<RenderProps>) {
    this._renderer.getRenderItemType("background")?.item.setRenderProps(props);
  }

  setTagsRenderProps(props: Partial<RenderProps>) {
    this._renderer.getRenderItemType("tags")?.item?.setRenderProps(props);
  }

  setDripsRenderProps(props: Partial<RenderProps>) {
    this._renderer.getRenderItemType("drips")?.item?.setRenderProps(props);
  }

  setFrame(frame: number, time?: number) {
    this.animation.setFrame(frame, time);
  }

  setPosition(value: number, relative = false) {
    const position = relative ? this.currentPosition + value : value;
    const time = this.animation.totalTime * clamp(position, 0, 1);
    const index = this.animation.getFrameIndex(time);
    this.animation.setFrame(index, time);
  }

  setTime(value: number, relative = false) {
    this.setPosition((relative ? this.animation.time + value : value) / this.animation.totalTime);
  }

  get currentPosition() {
    const { time: currentTime, totalTime } = this.animation;
    return currentTime / totalTime;
  }

  get currentTime() {
    return this.state.time;
  }

  get state() {
    return this.animation.getState();
  }

  get isLooping() {
    return this._animation.isLooping;
  }

  get isPlaying() {
    return this._animation.isPlaying;
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  restart() {
    this._animation.setFrame(0, 0);
    this._animation.start();
  }

  start() {
    this._animation.start();
    this._requestAnimationFrame();
  }

  stop() {
    this._animation.stop();
    this._cancelAnimationFrame();
  }

  unload() {
    this._cancelAnimationFrame();
    this._animation.unload();
    this._renderer.unload();
  }

  setLoop(value: boolean) {
    this._animation.setLoop(value);
  }

  setSpeed(value: number) {
    this._animation.setSpeed(value);
  }

  setRotation(value: number) {
    this._renderer.setRotation(value);
  }

  setScale(value: number) {
    this._renderer.setScale(value);
  }

  setOffset(x: number, y: number) {
    this._renderer.setOffset(x, y);
  }

  draw() {
    this._renderer.render(this._animation.getState());
  }

  private _requestAnimationFrame() {
    this._animationRequest = GML_requestAnimationFrame(() => {
      this.draw();
      this._requestAnimationFrame();
    });
  }

  private _cancelAnimationFrame() {
    if (this._animationRequest) {
      GML_cancelAnimationFrame(this._animationRequest);
      this._animationRequest = null;
    }
  }
}
