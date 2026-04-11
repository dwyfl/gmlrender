import { type GMLCanvasContext } from "../../isomorphic/canvas.ts";

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
  constructor(props?: Partial<RenderProps>) {
    this.fillStyle = props?.fillStyle ?? "#000";
    this.strokeStyle = props?.strokeStyle ?? "#000";
    this.lineWidth = props?.lineWidth ?? 0;
    this.lineCap = props?.lineCap ?? "round";
    this.lineJoin = props?.lineJoin ?? "round";
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
