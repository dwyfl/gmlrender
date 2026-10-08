import { GML } from "gmljs";
import { GMLRenderer, type RenderItemEntry } from "./render/index.ts";
import { GMLAnimation, type GMLAnimationState } from "./animation/animation.ts";
import {
  GML_requestAnimationFrame,
  GML_cancelAnimationFrame,
  GML_time,
} from "./isomorphic/time.ts";
import {
  RenderItemBackground,
  RenderItemTags,
  RenderItemDrips,
  RenderItemTypeMap,
  isRenderItemTypeKey,
  type RenderItemOfType,
  type RenderItemTypeKey,
} from "./render/item/index.ts";
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

  override addEventListener<K extends GMLViewEvent>(
    type: K,
    listener: (event: CustomEvent<GMLAnimationState>) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(type: string, listener: any, options?: any): void {
    super.addEventListener(type, listener, options);
  }

  override removeEventListener<K extends GMLViewEvent>(
    type: K,
    listener: (event: CustomEvent<GMLAnimationState>) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
  override removeEventListener(
    type: string,
    listener: any,
    options?: any,
  ): void {
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
    const wasPlaying = this.isPlaying;
    this._cancelAnimationFrame();
    const settings = this._getRenderItemSettings();
    this._gml = this._initGml(gml);
    this._animation = this._initAnimation(this._gml);
    this._initRenderer(this._initRenderItems(this._gml));
    this._applyRenderItemSettings(settings);
    if (wasPlaying) {
      this.start();
    }
  }

  private _initGml(document: GML | string) {
    return typeof document === "string" ? new GML(document) : document;
  }

  private _initAnimation(gml: GML) {
    if (this._animation) {
      this._animation.unload();
      this._animation.removeEventListener(
        GMLAnimation.EVENT_START,
        this._animationEventHandler,
      );
      this._animation.removeEventListener(
        GMLAnimation.EVENT_RESTART,
        this._animationEventHandler,
      );
      this._animation.removeEventListener(
        GMLAnimation.EVENT_STOP,
        this._animationEventHandler,
      );
    }
    const animation = new GMLAnimation(gml);
    animation.addEventListener(
      GMLAnimation.EVENT_START,
      this._animationEventHandler,
    );
    animation.addEventListener(
      GMLAnimation.EVENT_RESTART,
      this._animationEventHandler,
    );
    animation.addEventListener(
      GMLAnimation.EVENT_STOP,
      this._animationEventHandler,
    );
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
    this.setRenderItemVisible("drips", false); // drips are opt-in for now
  }

  /**
   * Captures the user-facing settings of the built-in render items (props, visibility and
   * options), so they survive rebuilding the items in setGml() and setRenderer().
   */
  private _getRenderItemSettings() {
    const background = this.getRenderItem("background");
    const tags = this.getRenderItem("tags");
    const drips = this.getRenderItem("drips");
    return {
      background: background && {
        visible: background.visible,
        props: background.item.getRenderProps(),
      },
      tags: tags && {
        visible: tags.visible,
        props: tags.item.getRenderProps(),
        options: tags.item.getOptions(),
      },
      drips: drips && {
        visible: drips.visible,
        props: drips.item.getRenderProps(),
        options: drips.item.getOptions(),
      },
    };
  }

  private _applyRenderItemSettings({
    background,
    tags,
    drips,
  }: ReturnType<GMLView["_getRenderItemSettings"]>) {
    for (const [type, settings] of [
      ["background", background],
      ["tags", tags],
      ["drips", drips],
    ] as const) {
      if (settings) {
        this.setRenderItemVisible(type, settings.visible);
        this.setRenderItemProps(type, settings.props);
      }
    }
    if (tags) {
      this.getRenderItem("tags")?.item.setOptions(tags.options);
    }
    if (drips) {
      this.getRenderItem("drips")?.item.setOptions(drips.options);
    }
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
    const settings = this._getRenderItemSettings();
    this._renderer = renderer;
    this._initRenderer(this._initRenderItems(this._gml));
    this._applyRenderItemSettings(settings);
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

  /**
   * Returns the render item entry of the given type. The built-in types ("background",
   * "tags", "drips") return their concrete item class, e.g. RenderItemDrips for "drips".
   */
  getRenderItem<K extends RenderItemTypeKey>(
    type: K,
  ): RenderItemEntry<RenderItemOfType<K>> | undefined;
  getRenderItem(type: string): RenderItemEntry | undefined;
  getRenderItem(type: string): RenderItemEntry | undefined {
    const entry = this._renderer.getRenderItemType(type);
    // Guarantee the narrowed type: a custom item could reuse a built-in type name.
    if (
      entry &&
      isRenderItemTypeKey(type) &&
      !(entry.item instanceof RenderItemTypeMap[type])
    ) {
      return undefined;
    }
    return entry;
  }

  setRenderItemProps(type: string, props: Partial<RenderProps>) {
    this._renderer.getRenderItemType(type)?.item.setRenderProps(props);
  }

  setRenderItemVisible(type: string, visible: boolean) {
    const entry = this._renderer.getRenderItemType(type);
    if (entry) {
      entry.visible = visible;
    }
  }

  setFrame(frame: number, time?: number) {
    this.animation.setFrame(frame, time);
  }

  setPosition(value: number, relative = false) {
    const position = relative ? this.currentPosition + value : value;
    this.setTime(this.animation.totalTime * clamp(position, 0, 1));
  }

  setTime(value: number, relative = false) {
    const time = clamp(
      relative ? this.animation.time + value : value,
      0,
      this.animation.totalTime,
    );
    this.animation.setFrame(this.animation.getFrameIndex(time), time);
  }

  get currentPosition() {
    const { time: currentTime, totalTime } = this.animation;
    return totalTime > 0 ? currentTime / totalTime : 0;
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
    this.start();
  }

  start() {
    this._cancelAnimationFrame();
    this._animation.start(GML_time());
    if (this._animation.isPlaying) {
      this._requestAnimationFrame();
    }
  }

  stop() {
    this._cancelAnimationFrame();
    this._animation.stop();
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

  setSize(width: number, height: number) {
    this._renderer.context.width = width;
    this._renderer.context.height = height;
    this._renderer.setScreenBounds(width, height);
  }

  draw() {
    this._renderer.render(this._animation.getState());
  }

  /**
   * The view's single frame loop: advance the animation, then draw. The loop ends by itself
   * when the animation stops playing (e.g. at the end of a non-looping animation).
   */
  private _requestAnimationFrame() {
    this._animationRequest = GML_requestAnimationFrame((time) => {
      this._animationRequest = null;
      this._animation.tick(time);
      this.draw();
      if (this._animation.isPlaying) {
        this._requestAnimationFrame();
      }
    });
  }

  private _cancelAnimationFrame() {
    if (this._animationRequest !== null) {
      GML_cancelAnimationFrame(this._animationRequest);
      this._animationRequest = null;
    }
  }
}
