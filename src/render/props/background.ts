import { BaseRenderProps, type RenderProps } from "./index.ts";

export class BackgroundRenderProps extends BaseRenderProps {
  constructor(props?: Partial<RenderProps>) {
    super({ fillStyle: "#fff", ...props });
  }
}
