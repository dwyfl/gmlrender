import { mat3, vec3 } from "gl-matrix";
import { Environment } from "./base.ts";
import { GMLTag } from "gmljs";

type Vector3 = [x: number, y: number, z: number];

const DEFAULT_CLIENT_ENVS: {
  clientNames: string[];
  screenBounds: [width: number, height: number];
  up: Vector3;
}[] = [
  {
    clientNames: [
      "Graffiti Analysis 2.0: DustTag",
      "DustTag: Graffiti Analysis 2.0",
      "Fat Tag - Katsu Edition",
    ],
    screenBounds: [480, 320],
    up: [1, 0, 0],
  },
];

/**
 * GML's y axis points down on screen, so "up" on screen is (0, -1, 0).
 */
const SCREEN_UP: Vector3 = [0, -1, 0];

export class TagEnvironment extends Environment {
  private upVector: Vector3;

  constructor(tag: GMLTag) {
    super();
    this.upVector = SCREEN_UP;
    this._initFromTag(tag);
  }

  private _initFromTag(tag: GMLTag) {
    const defaultEnv = this.getClientDefaults(tag);
    const tagEnv = tag.getEnvironment();
    // gmljs returns no bounds for an incomplete <screenBounds> (and lists a warning), so
    // it falls back like a missing one.
    const screenBounds = tagEnv?.getScreenBounds() ?? defaultEnv?.screenBounds;
    if (screenBounds) {
      this.setScreenBoundsValues(...screenBounds);
    }
    const offset = tagEnv?.getOffset();
    if (offset) {
      this.setOffset(offset);
    }
    // The <rotation> element is very vaguely specified in the spec; it is ignored for now.
    this.upVector = this.getEffectiveUp(tagEnv?.getUp(), defaultEnv?.up);
    this.setTransform(TagEnvironment.getUpTransform(this.upVector));
  }

  /**
   * The direction that is "up" for this tag, in GML space. The tag transform rotates it to
   * point up on screen.
   */
  getUpVector(): vec3 {
    return vec3.fromValues(...this.upVector);
  }

  private getClientDefaults(tag: GMLTag) {
    const clientName = tag.getClientName();
    return DEFAULT_CLIENT_ENVS.find((env) =>
      env.clientNames.includes(clientName),
    );
  }

  /**
   * The tag's <up> if it has a direction in the drawing plane, otherwise the client's
   * default, otherwise screen up (no rotation). Some documents have (0,0,0) as up vector.
   */
  private getEffectiveUp(tagUp?: Vector3, clientUp?: Vector3): Vector3 {
    for (const up of [tagUp, clientUp]) {
      if (up && (up[0] !== 0 || up[1] !== 0)) {
        return [...up];
      }
    }
    return SCREEN_UP;
  }

  /**
   * Rotation in the drawing plane that turns `up` to point up on screen. The z component is
   * ignored, and the vector does not need to be normalized.
   */
  private static getUpTransform([x, y]: Vector3): mat3 {
    const length = Math.hypot(x, y);
    if (length === 0) {
      return mat3.create();
    }
    // The rotation maps the unit vector u = (x, y) to (0, -1):
    // cos = u · (0, -1), sin = u × (0, -1) (z component).
    // `|| 0` turns -0 into 0, so axis-aligned vectors give exact matrices.
    const cos = -y / length || 0;
    const sin = -x / length || 0;
    return mat3.fromValues(cos, sin, 0, -sin || 0, cos, 0, 0, 0, 1);
  }
}
