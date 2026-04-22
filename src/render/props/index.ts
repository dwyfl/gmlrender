export type RenderLineCap = "butt" | "round" | "square";
export type RenderLineJoin = "bevel" | "miter" | "round";
export type RenderLineWidth = number;
export type RenderFillStyle = string;
export type RenderStrokeStyle = string;

export interface RenderProps {
  fillStyle: RenderFillStyle;
  strokeStyle: RenderStrokeStyle;
  lineWidth: RenderLineWidth;
  lineCap: RenderLineCap;
  lineJoin: RenderLineJoin;
}

export function isRenderPropType(value: unknown): value is keyof RenderProps {
  return (
    value === "fillStyle" ||
    value === "strokeStyle" ||
    value === "lineWidth" ||
    value === "lineCap" ||
    value === "lineJoin"
  );
}

export function isRenderProp<T extends keyof RenderProps>(
  type: T,
  value: unknown,
): value is RenderProps[T] {
  switch (type) {
    case "fillStyle":
    case "strokeStyle":
      return typeof value === "string";
    case "lineWidth":
      return typeof value === "number";
    case "lineCap":
      return value === "butt" || value === "round" || value === "square";
    case "lineJoin":
      return value === "bevel" || value === "miter" || value === "round";
    default:
      return false;
  }
}

export class BaseRenderProps {
  fillStyle: RenderFillStyle;
  strokeStyle: RenderStrokeStyle;
  lineWidth: RenderLineWidth;
  lineCap: RenderLineCap;
  lineJoin: RenderLineJoin;

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
