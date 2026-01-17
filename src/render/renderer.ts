import { ClientEnvironment } from "../environment";
import { RenderContextBase } from "./context/base";
import { RenderState } from "./state";
import { RenderItem } from "./item/base";
import { GMLAnimationState } from "../animation/animation";

export interface RenderItemEntry {
  item: RenderItem;
  visible: boolean;
}

export class GMLRenderer {
  clientEnvironment: ClientEnvironment;
  renderContext: RenderContextBase;
  renderItems: RenderItemEntry[];
  private renderState: RenderState;

  constructor(context: RenderContextBase) {
    this.clientEnvironment = new ClientEnvironment(
      context.width,
      context.height
    );
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
  addRenderItem(
    item: RenderItem,
    index: number | null = null,
    visible: boolean = true
  ) {
    this.renderItems.splice(
      index === null ? this.renderItems.length : index,
      0,
      { item, visible }
    );
  }
  addRenderItems(items: RenderItem[]) {
    items.forEach((item) => this.addRenderItem(item));
  }
  removeRenderItem(index: number) {
    this.renderItems.splice(index, 1);
  }
  render(state: GMLAnimationState) {
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
  setLineWidth(value: number) {
    this.renderState.setRenderOption(
      "lineWidth",
      Math.min(Math.max(parseFloat(String(value)), 0), 1)
    );
  }
}
