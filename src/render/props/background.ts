import { BaseRenderProps } from "./index";

export class BackgroundRenderProps extends BaseRenderProps {
  constructor(color = "#fff") {
    super();
    this.fillStyle = color;
  }
}
