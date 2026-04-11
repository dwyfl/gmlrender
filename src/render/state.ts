import { type GMLAnimationState } from "../animation/animation.ts";
import { ClientEnvironment } from "../environment/index.ts";
import { type RenderProps } from "./props/index.ts";

export class RenderState {
  clientEnvironment: ClientEnvironment;
  animationState: GMLAnimationState;
  private renderProps: Partial<RenderProps>;

  constructor(
    clientEnvironment: ClientEnvironment,
    animationState: GMLAnimationState,
    options?: RenderProps,
  ) {
    this.clientEnvironment = clientEnvironment;
    this.animationState = animationState;
    this.renderProps = { ...options };
  }

  setRenderOptions(renderProps: Partial<RenderProps>) {
    this.renderProps = { ...this.renderProps, ...renderProps };
  }

  setRenderOption<T extends keyof RenderProps>(key: T, value: RenderProps[T]) {
    this.renderProps[key] = value;
  }

  deleteRenderOption(key: keyof RenderProps) {
    delete this.renderProps[key];
  }

  getRenderOption<T extends keyof RenderProps>(key: T): RenderProps[T] | undefined {
    return this.renderProps[key];
  }

  hasRenderOption(key: keyof RenderProps) {
    return key in this.renderProps && this.renderProps[key] !== undefined;
  }

  getTagRenderLimit() {
    return this.animationState.frame?.tag;
  }

  getDrawingRenderLimit(tagIndex: number) {
    const { frame } = this.animationState;
    return frame && tagIndex === frame.tag ? frame.drawing : undefined;
  }

  getStrokeRenderLimit(tagIndex: number, drawingIndex: number) {
    const { frame } = this.animationState;
    return frame && tagIndex === frame.tag && drawingIndex === frame.drawing
      ? frame.stroke
      : undefined;
  }

  getPointRenderLimit(tagIndex: number, drawingIndex: number, strokeIndex: number) {
    const { frame } = this.animationState;
    return frame &&
      tagIndex === frame.tag &&
      drawingIndex === frame.drawing &&
      strokeIndex === frame.stroke
      ? frame.point
      : undefined;
  }
}
