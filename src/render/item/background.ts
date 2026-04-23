import { GML } from "gmljs";
import { vec3 } from "gl-matrix";
import { RenderItem } from "./base.ts";
import { BackgroundRenderProps } from "../props/background.ts";
import { RenderContextBase } from "../context.ts";
import { RenderState } from "../state.ts";

export class RenderItemBackground extends RenderItem {
  private static readonly CORNER_POINTS = [
    vec3.fromValues(0, 0, 0),
    vec3.fromValues(0, 1, 0),
    vec3.fromValues(1, 1, 0),
    vec3.fromValues(1, 0, 0),
  ];
  private p: vec3;

  constructor(gml: GML, color?: string) {
    super(gml);
    this.p = vec3.create();
    this.renderProps = new BackgroundRenderProps(color ? { fillStyle: color } : undefined);
    this.tagEnvironments.forEach((env) => {
      env.setOffsetValues(0, 0); // Don't offset the background
    });
  }

  get type() {
    return "background";
  }

  setColor(value: string) {
    this.setRenderProps({ fillStyle: value });
  }

  render(ctx: RenderContextBase, renderState: RenderState) {
    this.gml.getTags().forEach((_, index) => {
      this.initProjectionTransforms(this.getTagEnvironment(index), renderState.clientEnvironment);
      this.renderBackground(ctx);
    });
  }

  private renderBackground(ctx: RenderContextBase) {
    const { p } = this;
    ctx.setRenderProps(this.renderProps);
    ctx.beginPath();
    for (let i = 0; i < RenderItemBackground.CORNER_POINTS.length; ++i) {
      this.projectPoint(p, RenderItemBackground.CORNER_POINTS[i]);
      if (i === 0) {
        ctx.moveTo(p[0], p[1]);
      } else {
        ctx.lineTo(p[0], p[1]);
      }
    }
    ctx.closePath();
    ctx.fill();
  }
}
