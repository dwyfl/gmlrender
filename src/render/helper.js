import { mat3, vec3 } from '../vendor/gl-matrix';

export default class RenderHelper {
  static getVectorFromPoint(p) {
    return vec3.fromValues(p.x, p.y, isNaN(p.z) ? 0 : p.z);
  }
  static getPointFromVector(v) {
    return { x: v[0], y: v[1], z: v[2] };
  }
  static getZeroMat3() {
    return mat3.fromValues(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
  static getProjectedPoint(gmlEnv, clientEnv, point) {
    const screenBounds = vec3.fromValues(clientEnv.screenBounds.x, clientEnv.screenBounds.x, 0);
    const screenCenter = vec3.fromValues(clientEnv.screenCenter.x, clientEnv.screenCenter.y, 0);
    const p1 = vec3.create();
    const p2 = vec3.fromValues(
      point.x - 0.5,
      point.y - 0.5,
      isNaN(point.z) ? 0 : point.z
    );
    vec3.transformMat3(p1, p2, gmlEnv.transform);
    vec3.mul(p1, p1, screenBounds);
    vec3.add(p1, p1, gmlEnv.offset);
    vec3.transformMat3(p2, p1, clientEnv.transform);
    vec3.add(p2, p2, screenCenter);
    vec3.add(p2, p2, clientEnv.offset);
    return { x: p2[0], y: p2[1] };
  }
  static getScreenBoundsTransformFromEnvironment(env, width, height) {
    if (env.screenBounds) {
      // Scale to fit original screen into our context.
      // Z coordinate is currently ignored.
      let boundsWidth = parseFloat(env.screenBounds.x);
      let boundsHeight = parseFloat(env.screenBounds.y);
      if (isNaN(boundsWidth) || boundsWidth <= 0)
        boundsWidth = width;
      if (isNaN(boundsHeight) || boundsHeight <= 0)
        boundsHeight = height;
      if (boundsWidth != width || boundsHeight != height) {
        let dx = boundsWidth / width;
        let dy = boundsHeight / height;
        let s;
        if (dx > 1 || dy > 1) {
          s = 1.0 / Math.max(dy, dx);
          dx *= s;
          dy *= s;
        } else if (dx < 1 && dy < 1) {
          s = 1.0 / Math.max(dy, dx);
          dx *= s;
          dy *= s;
        }
        return mat3.fromScaling(this.getZeroMat3(), [dx, dy]);
      }
    }
    return mat3.create();
  }
}