import { mat3, vec3 } from "gl-matrix";
import { Environment } from "../environment/base";
import { ClientEnvironment } from "../environment/client";

interface Point3D {
  x: number;
  y: number;
  z?: number;
}

export class RenderHelper {
  static getVectorFromPoint(p: Point3D): vec3 {
    return vec3.fromValues(p.x, p.y, isNaN(p.z ?? NaN) ? 0 : p.z ?? 0);
  }

  static getPointFromVector(v: vec3): Point3D {
    return { x: v[0], y: v[1], z: v[2] };
  }

  static getZeroMat3(): mat3 {
    return mat3.fromValues(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  static getProjectedPoint(
    gmlEnv: Environment,
    clientEnv: ClientEnvironment,
    point: Point3D
  ): Point3D {
    const screenBounds = vec3.fromValues(
      clientEnv.screenBounds[0],
      clientEnv.screenBounds[0],
      0
    );
    const screenCenter = vec3.fromValues(
      clientEnv.screenCenter[0],
      clientEnv.screenCenter[1],
      0
    );
    const p1 = vec3.create();
    const p2 = vec3.fromValues(
      point.x - 0.5,
      point.y - 0.5,
      isNaN(point.z ?? NaN) ? 0 : point.z ?? 0
    );
    vec3.transformMat3(p1, p2, gmlEnv.transform);
    vec3.mul(p1, p1, screenBounds);
    vec3.add(p1, p1, gmlEnv.offset);
    vec3.transformMat3(p2, p1, clientEnv.transform);
    vec3.add(p2, p2, screenCenter);
    vec3.add(p2, p2, clientEnv.offset);
    return { x: p2[0], y: p2[1] };
  }

  static getScreenBoundsTransformFromEnvironment(
    env: Environment,
    width: number,
    height: number
  ): mat3 {
    if (env.screenBounds) {
      // Scale to fit original screen into our context.
      // Z coordinate is currently ignored.
      let boundsWidth = parseFloat(String(env.screenBounds[0]));
      let boundsHeight = parseFloat(String(env.screenBounds[1]));
      if (isNaN(boundsWidth) || boundsWidth <= 0) boundsWidth = width;
      if (isNaN(boundsHeight) || boundsHeight <= 0) boundsHeight = height;
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
