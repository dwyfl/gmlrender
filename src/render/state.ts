import { type GMLAnimationState } from "../animation/animation.ts";
import { ClientEnvironment } from "../environment/index.ts";

export class RenderState {
  clientEnvironment: ClientEnvironment;
  animationState: GMLAnimationState;

  constructor(
    clientEnvironment: ClientEnvironment,
    animationState: GMLAnimationState,
  ) {
    this.clientEnvironment = clientEnvironment;
    this.animationState = animationState;
  }

  get time() {
    return this.animationState.time;
  }

  get frame() {
    return this.animationState.frame;
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

  getPointRenderLimit(
    tagIndex: number,
    drawingIndex: number,
    strokeIndex: number,
  ) {
    const { frame } = this.animationState;
    return frame &&
      tagIndex === frame.tag &&
      drawingIndex === frame.drawing &&
      strokeIndex === frame.stroke
      ? frame.point
      : undefined;
  }

  /**
   * Timeline times of the segment currently being drawn: from the current frame's point to
   * the next point of the same stroke. Undefined at the end of a stroke.
   */
  getCurrentSegmentTimes(): [number, number] | undefined {
    const { frame, frameIndex, timeline } = this.animationState;
    const next = timeline[frameIndex + 1];
    if (
      !frame ||
      !next ||
      next.tag !== frame.tag ||
      next.drawing !== frame.drawing ||
      next.stroke !== frame.stroke
    ) {
      return undefined;
    }
    return [frame.t, next.t];
  }
}
