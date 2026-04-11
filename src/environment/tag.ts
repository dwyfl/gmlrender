import { mat3, vec3 } from "gl-matrix";
import { Environment } from "./base.ts";
import { GMLTag } from "gmljs";

const DEFAULT_CLIENT_ENVS = [
  {
    clientNames: [
      "Graffiti Analysis 2.0: DustTag",
      "DustTag: Graffiti Analysis 2.0",
      "Fat Tag - Katsu Edition",
    ],
    screenBounds: [480, 320], // width, height
    up: [1, 0, 0], // x, y, z
  },
];

export class TagEnvironment extends Environment {
  tag: GMLTag;
  constructor(tag: GMLTag) {
    super();
    this.tag = tag;
    this.loadFromTag(tag);
  }
  private loadFromTag(tag: GMLTag) {
    this.tag = tag;
    const defaultEnv = this.getClientDefaults(tag);
    const tagEnv = tag.getEnvironment();
    const screenBounds = tagEnv?.getScreenBounds() ?? defaultEnv?.screenBounds;
    if (screenBounds) {
      this.setScreenBoundsValues(screenBounds[0], screenBounds[1]);
    }
    const offset = tagEnv?.getOffset();
    if (offset) {
      this.setOffset(offset);
    }
    const up = tagEnv?.getUp() ?? defaultEnv?.up;
    const rotation = tagEnv?.getRotation();
    if (up || rotation) {
      this.setTransform(this.getTransformFromEnvironment(up, rotation));
    }
  }
  private getClientDefaults(tag: GMLTag) {
    const clientName = tag.getClientName();
    return DEFAULT_CLIENT_ENVS.find((env) => env.clientNames.includes(clientName));
  }
  private getTransformFromEnvironment(up?: vec3, rotation?: vec3): mat3 {
    const m = mat3.create();
    if (up) {
      const upTransform = this.getUpTransform(up);
      mat3.multiply(m, m, upTransform);
    }
    if (rotation) {
      // This property is very vaguely specified in the spec.
      // Ignore it for now.
    }
    return m;
  }
  private getUpTransform([x, y, z]: vec3) {
    const m = mat3.create();
    // Some GML documents have (0,0,0) as up vector
    if (Math.abs(x) + Math.abs(y) + Math.abs(z) === 0) {
      return m;
    }
    // GMLRender uses (0,1,0) as up vector.
    // Find angle between this and up vector and create rotation matrix.
    const a = vec3.fromValues(x, y, z);
    const b = vec3.fromValues(0, 1, 0);
    const r = this.getRotationMatrixToAlignVectors(a, b);
    mat3.copy(m, r);
    mat3.str(m);
    return m;
  }
  private getRotationMatrixToAlignVectors(a: vec3, b: vec3): mat3 {
    // Z coordinate is currently ignored.
    const m = mat3.create();
    const alen = vec3.length(a);
    if (alen > 1.0) vec3.scale(a, a, 1 / alen);
    const blen = vec3.length(b);
    if (blen > 1.0) vec3.scale(b, b, 1 / blen);
    const abdot = vec3.dot(a, b);
    if (abdot === 1 || abdot === -1 || alen === 0 || blen === 0) return m;
    const v = vec3.create();
    vec3.cross(v, a, b);
    // Skew-symmetric cross-product matrix of v
    const s = vec3.length(v);
    const f = s !== 0 ? (1 - abdot) / (s * s) : 0;
    const vx2 = mat3.create();
    const vx = mat3.fromValues(0, -v[2], v[1], v[2], 0, -v[0], -v[1], v[0], 0);
    mat3.multiply(vx2, vx, vx);
    mat3.multiplyScalar(vx2, vx2, f);
    mat3.add(m, m, vx);
    mat3.add(m, m, vx2);
    return m;
  }
}
