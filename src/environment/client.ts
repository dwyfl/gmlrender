import { mat3 } from "gl-matrix";
import { Environment } from "./base";

export class ClientEnvironment extends Environment {
  rotation: number;
  scale: number;

  constructor(width: number, height: number) {
    super();
    this.setScreenBoundsValues(width, height);
    this.rotation = 0; // Radians
    this.scale = 1;
  }

  setRotation(value: number) {
    this.rotation = Number.isFinite(value) ? value : 0;
    this.updateTransform();
  }

  setScale(value: number) {
    this.scale = Number.isFinite(value) ? value : 1;
    this.updateTransform();
  }

  private updateTransform() {
    if (this.rotation !== 0) {
      mat3.fromRotation(this.transform, this.rotation);
    } else {
      mat3.identity(this.transform);
    }
    if (this.scale !== 1) {
      mat3.multiplyScalar(this.transform, this.transform, this.scale);
    }
  }
}
