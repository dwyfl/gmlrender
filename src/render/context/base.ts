import { type RenderProps } from "../props/index.ts";

export type RenderFormat = "jpeg" | "png";
export abstract class RenderContextBase {
  static EVENT_RESIZE = "event_resize";
  abstract get width(): number;
  abstract get height(): number;
  abstract set width(value: number);
  abstract set height(value: number);
  abstract beginPath(): void;
  abstract closePath(): void;
  abstract moveTo(x: number, y: number): void;
  abstract lineTo(x: number, y: number): void;
  abstract fill(): void;
  abstract stroke(): void;
  abstract clear(color?: string): void;
  abstract setRenderProps(props: Partial<RenderProps>): void;
  abstract toDataURL(type: RenderFormat, quality?: number): string;
  // abstract toDataBlob(type: RenderFormat, quality?: number): string;
}
