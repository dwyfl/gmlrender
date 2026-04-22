import { type RenderProps } from "../props/index.ts";

export type RenderImageFormat = "jpeg" | "png" | "webp";
export interface RenderImageOptions {
  type: RenderImageFormat;
  quality?: number;
}

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
  abstract renderToBlob(options?: RenderImageOptions): Promise<Blob>;
  abstract renderToDataURL(options?: RenderImageOptions): Promise<string>;
}
