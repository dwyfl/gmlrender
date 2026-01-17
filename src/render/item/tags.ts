import { GML } from "gmljs";
import { vec3 } from "gl-matrix";
import { RenderItem } from "./base";
import { ForegroundRenderProps } from "../props/foreground";
import { RenderState } from "../state";
import { RenderContextBase } from "../context/base";

export class RenderItemTags extends RenderItem {
  private static readonly DEFAULT_LINE_WIDTH = 2;
  private p1: vec3;
  private p2: vec3;

  constructor(gml: GML) {
    super(gml);
    this.p1 = vec3.create();
    this.p2 = vec3.create();
    this.renderProps = new ForegroundRenderProps();
  }

  get type() {
    return "tags";
  }

  render(renderContext: RenderContextBase, renderState: RenderState) {
    const tags = this.gml.getTags();
    const tagLimit = renderState.getTagRenderLimit() ?? tags.length - 1;
    for (let i = 0; i <= tagLimit; i += 1) {
      this.initProjectionTransforms(
        this.getTagEnvironment(i),
        renderState.clientEnvironment
      );
      this.renderTag(renderContext, renderState, i);
    }
  }

  private renderTag(
    renderContext: RenderContextBase,
    renderState: RenderState,
    tagIndex: number
  ) {
    const drawings = this.gml.getDrawings(tagIndex) || [];
    const drawingLimit =
      renderState.getDrawingRenderLimit(tagIndex) ?? drawings.length - 1;
    for (let i = 0; i <= drawingLimit; i += 1) {
      this.renderDrawing(renderContext, renderState, tagIndex, i);
    }
  }

  private renderDrawing(
    renderContext: RenderContextBase,
    renderState: RenderState,
    tagIndex: number,
    drawingIndex: number
  ) {
    const strokes = this.gml.getStrokes(tagIndex, drawingIndex) || [];
    const strokeLimit =
      renderState.getStrokeRenderLimit(tagIndex, drawingIndex) ??
      strokes.length - 1;
    for (let i = 0; i <= strokeLimit; i += 1) {
      if (!strokes[i].isDrawing()) {
        continue;
      }
      this.renderStroke(renderContext, renderState, tagIndex, drawingIndex, i);
    }
  }

  private renderStroke(
    renderContext: RenderContextBase,
    renderState: RenderState,
    tagIndex: number,
    drawingIndex: number,
    strokeIndex: number
  ) {
    const points =
      this.gml.getPoints(tagIndex, drawingIndex, strokeIndex) || [];
    const pointLimit =
      renderState.getPointRenderLimit(tagIndex, drawingIndex, strokeIndex) ??
      points.length - 1;

    if (points.length === 0 || pointLimit < 0) {
      return;
    }

    renderContext.beginPath();
    renderContext.setRenderProps({
      lineWidth:
        (renderState.getRenderOption("lineWidth") ??
          RenderItemTags.DEFAULT_LINE_WIDTH) *
        renderState.clientEnvironment.scale, // ???
    });

    const { p1, p2 } = this;
    const { time } = renderState.animationState;

    for (let i = 0; i <= pointLimit; ++i) {
      this.projectPoint(p1, points[i].getXYZ());
      if (i == 0) {
        renderContext.moveTo(p1[0], p1[1]);
      } else {
        renderContext.lineTo(p1[0], p1[1]);
      }
      if (i == pointLimit && i < points.length - 1 && time > 0) {
        this.projectPoint(p2, points[i + 1].getXYZ());
        const t1 = points[i].getT();
        const t2 = points[i + 1].getT();
        if (t1 === undefined || t2 === undefined || t2 <= t1) {
          continue;
        }
        const tt = Math.min(Math.max(time, t1), t2);
        const dt = t1 >= t2 ? 0 : (tt - t1) / (t2 - t1);
        const dx = p1[0] + (p2[0] - p1[0]) * dt;
        const dy = p1[1] + (p2[1] - p1[1]) * dt;
        renderContext.lineTo(dx, dy);
      }
    }
    renderContext.stroke();
  }
}
