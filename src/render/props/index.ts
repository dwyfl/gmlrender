import { GMLCanvasContext } from "../../isomorphic/canvas";

export type RenderProps = Pick<
  GMLCanvasContext,
  "lineCap" | "lineJoin" | "lineWidth" | "strokeStyle" | "fillStyle"
>;

export class BaseRenderProps {
  fillStyle: RenderProps["fillStyle"];
  strokeStyle: RenderProps["strokeStyle"];
  lineWidth: RenderProps["lineWidth"];
  lineCap: RenderProps["lineCap"];
  lineJoin: RenderProps["lineJoin"];
  constructor() {
    this.fillStyle = "#000";
    this.strokeStyle = "#000";
    this.lineWidth = 0;
    this.lineCap = "round";
    this.lineJoin = "round";
  }
  toObject() {
    return {
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      lineJoin: this.lineJoin,
    } satisfies RenderProps;
  }
}
