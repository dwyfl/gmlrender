import { mat3, vec2, vec3 } from "gl-matrix";

// Most older apps have a 4:3 screen format, so use this as default.
const DEFAULT_SCREEN_BOUNDS = vec3.fromValues(1024, 768, 0);

export class Environment {
  screenBounds: vec3;
  screenCenter: vec3;
  transform: mat3;
  offset: vec3;
  constructor(screenBounds?: vec3, transform?: mat3, offset?: vec3) {
    this.screenBounds = vec3.create();
    this.screenCenter = vec3.create();
    this.transform = mat3.create();
    this.offset = vec3.create();
    if (screenBounds !== undefined) {
      this.setScreenBounds(screenBounds);
    } else {
      this.setScreenBounds(DEFAULT_SCREEN_BOUNDS);
    }
    if (offset !== undefined) {
      this.setOffset(offset);
    }
    if (transform !== undefined) {
      this.setTransform(transform);
    }
  }
  reset() {
    this.setScreenBounds(DEFAULT_SCREEN_BOUNDS);
    this.transform = mat3.create();
    this.offset = vec3.create();
  }
  getScreenBounds() {
    return this.screenBounds;
  }
  getScreenCenter() {
    return this.screenCenter;
  }
  getTransform() {
    return this.transform;
  }
  getOffset() {
    return this.offset;
  }
  setScreenBounds(value: vec2) {
    this.setScreenBoundsValues(value[0], value[1]);
  }
  setScreenBoundsValues(width: number, height: number) {
    vec3.set(this.screenBounds, width, height, 0);
    vec3.set(this.screenCenter, width * 0.5, height * 0.5, 0);
  }
  setOffset(value: vec2) {
    this.setOffsetValues(value[0], value[1]);
  }
  setOffsetValues(x: number, y: number) {
    vec3.set(this.offset, Number.isFinite(x) ? x : 0, Number.isFinite(y) ? y : 0, 0);
  }
  setTransform(transform: mat3) {
    mat3.copy(this.transform, transform);
  }
}
