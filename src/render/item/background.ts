import { GML } from "gmljs";
import { vec3 } from "gl-matrix";
import { RenderItem } from "./base";
import { BackgroundRenderProps } from "../props/background";
import { RenderContextBase } from "../context/base";
import { RenderState } from "../state";

export class RenderItemBackground extends RenderItem {
  private static readonly CORNER_POINTS = [
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(0, 1, 0),
    vec3.fromValues(1, 1, 0),
    vec3.fromValues(1, 0, 0),
  ];
  private p: vec3;

  constructor(gml: GML) {
    super(gml);
    this.p = vec3.create();
    this.renderProps = new BackgroundRenderProps();
    this.tagEnvironments.forEach((env) => {
      env.setOffsetValues(0, 0); // Don't offset the background
    });
  }

  get type() {
    return "background";
  }

  render(renderContext: RenderContextBase, renderState: RenderState) {
    this.gml.getTags().forEach((_, index) => {
      this.initProjectionTransforms(
        this.getTagEnvironment(index),
        renderState.clientEnvironment
      );
      this.renderBackground(renderContext);
    });
  }

  private renderBackground(renderContext: RenderContextBase) {
    const { p } = this;
    renderContext.beginPath();
    for (let i = 0; i < RenderItemBackground.CORNER_POINTS.length; ++i) {
      this.projectPoint(p, RenderItemBackground.CORNER_POINTS[i]);
      if (i === 0) {
        renderContext.moveTo(p[0], p[1]);
      } else {
        renderContext.lineTo(p[0], p[1]);
      }
    }
    renderContext.closePath();
    renderContext.fill();
  }
}
