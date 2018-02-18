import { mat3, vec3 } from '../vendor/gl-matrix';

// Most older apps have a 4:3 screen format, so use this as default.
const DEFAULT_SCREEN_BOUNDS = vec3.fromValues(1024, 768, 0);

export default class Environment {
  constructor(screenBounds, transform, offset) {
    this.screenBounds = vec3.create();
    this.screenCenter = vec3.create();
    this.transform = mat3.create();
    this.offset = vec3.create();
    if (screenBounds !== undefined) {
      this.setScreenBounds(screenBounds);
    }
    else {
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
  setScreenBounds(v) {
    this.setScreenBoundsValues(v[0], v[1]);
  }
  setScreenBoundsValues(width, height) {
    vec3.set(this.screenBounds, width, height, 0);
    vec3.set(this.screenCenter, width * 0.5, height * 0.5, 0);
  }
  setOffset(v) {
    this.setOffsetValues(v[0], v[1]);
  }
  setOffsetValues(x, y) {
    vec3.set(this.offset, isNaN(x) ? 0.0 : x, isNaN(y) ? 0.0 : y, 0);
  }
  setTransform(transform) {
    mat3.copy(this.transform, transform);
  }
}