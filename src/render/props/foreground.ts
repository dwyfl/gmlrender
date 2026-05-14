import { BaseRenderProps, type RenderProps } from "./index.ts";

export class ForegroundRenderProps extends BaseRenderProps {
  constructor(props?: Partial<RenderProps>) {
    super({ fillStyle: "#000", lineWidth: 4, ...props });
  }
}
