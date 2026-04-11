import { BaseRenderProps } from "./index.ts";

export class ForegroundRenderProps extends BaseRenderProps {
  constructor(color = "#000") {
    super();
    this.fillStyle = color;
  }
}
