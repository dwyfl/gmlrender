import { ClientEnvironment } from "../environment/index.ts";
import { RenderContextBase } from "./context.ts";
import { RenderState } from "./state.ts";
import { RenderItem } from "./item/base.ts";
import { type GMLAnimationState } from "../animation/animation.ts";

export interface RenderItemEntry {
  item: RenderItem;
  visible: boolean;
}

export class GMLRenderer {
  private clientEnvironment: ClientEnvironment;
  private renderContext: RenderContextBase;
  private renderItems: RenderItemEntry[];
  private renderState: RenderState;

  constructor(context: RenderContextBase) {
    this.clientEnvironment = new ClientEnvironment(context.width, context.height);
    this.renderContext = context;
    this.renderItems = [];
    this.renderState = new RenderState(this.clientEnvironment, {
      timeline: { length: 0, tag: 0 } as any,
      frame: undefined,
      frameIndex: 0,
      time: 0,
      totalFrames: 0,
      totalTime: 0,
    });
  }

  unload() {
    this.renderItems = [];
  }

  get context() {
    return this.renderContext;
  }

  get items() {
    return this.renderItems;
  }

  get env() {
    return this.clientEnvironment;
  }

  getRenderItem(index: number): RenderItemEntry | undefined {
    return this.renderItems[index];
  }

  getRenderItemType(type: string): RenderItemEntry | undefined {
    return this.renderItems.find(({ item }) => item.type === type);
  }

  addRenderItem(item: RenderItem, index: number | null = null, visible: boolean = true) {
    this.renderItems.splice(index === null ? this.renderItems.length : index, 0, { item, visible });
  }

  addRenderItems(items: RenderItem[]) {
    items.forEach((item) => this.addRenderItem(item));
  }

  removeRenderItem(index: number) {
    this.renderItems.splice(index, 1);
  }

  render(state: GMLAnimationState) {
    // TODO: apply this.renderState.renderProps?
    this.renderState.animationState = state;
    this.renderContext.clear();
    this.renderItems.forEach((renderItem) => {
      if (renderItem.visible) {
        this.renderContext.setRenderProps(renderItem.item.getRenderProps());
        renderItem.item.render(this.renderContext, this.renderState);
      }
    });
  }

  setRotation(value: number) {
    this.clientEnvironment.setRotation(value);
  }

  setScale(value: number) {
    this.clientEnvironment.setScale(value);
  }

  setOffset(x: number, y: number) {
    this.clientEnvironment.setOffsetValues(x, y);
  }

  setScreenBounds(width: number, height: number) {
    this.clientEnvironment.setScreenBoundsValues(width, height);
  }

  setLineWidth(value: number) {
    this.renderState.setRenderOption(
      "lineWidth",
      Math.min(Math.max(parseFloat(String(value)), 0), 1),
    );
  }
}
