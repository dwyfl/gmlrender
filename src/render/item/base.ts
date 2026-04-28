import { vec3, mat3, vec2, type ReadonlyVec3 } from "gl-matrix";
import { type ClientEnvironment, TagEnvironment } from "../../environment/index.ts";
import { BaseRenderProps, type RenderProps } from "../props/index.ts";
import { GML } from "gmljs";
import { RenderState } from "../state.ts";
import { RenderContextBase } from "../context.ts";

export abstract class RenderItem {
  private static readonly GML_ORIGIN = vec3.fromValues(0.5, 0.5, 0);
  gml: GML;
  renderProps: BaseRenderProps;
  tagEnvironments: TagEnvironment[];
  tagEnvironment?: TagEnvironment;
  clientEnvironment?: ClientEnvironment;
  clientScreenBounds?: vec3;

  constructor(gml: GML) {
    this.gml = gml;
    this.renderProps = new BaseRenderProps();
    this.tagEnvironments = gml.getTags().map((item) => new TagEnvironment(item));
  }

  abstract get type(): string;

  abstract render(renderContext: RenderContextBase, renderState: RenderState): void;

  getRenderProps() {
    return this.renderProps.toObject();
  }

  setRenderProps(props: Partial<RenderProps>) {
    for (const [key, value] of Object.entries(props)) {
      // @ts-expect-error this is fine
      this.renderProps[key] = value;
    }
  }

  getTagEnvironment(tagIndex: number) {
    return this.tagEnvironments[tagIndex];
  }

  initProjectionTransforms(tagEnvironment: TagEnvironment, clientEnvironment: ClientEnvironment) {
    const clientScreenBounds = vec3.create();
    const screenRatioTransform = RenderItem.getScreenRatioTransform(
      tagEnvironment.getScreenBounds(),
      clientEnvironment.getScreenBounds(),
    );
    vec3.transformMat3(
      clientScreenBounds,
      clientEnvironment.getScreenBounds(),
      screenRatioTransform,
    );
    this.clientScreenBounds = clientScreenBounds;
    this.clientEnvironment = clientEnvironment;
    this.tagEnvironment = tagEnvironment;
  }

  projectPoint(p: vec3, point: ReadonlyVec3) {
    if (!this.tagEnvironment || !this.clientEnvironment || !this.clientScreenBounds) {
      throw new Error("Projection environments not initialized");
    }
    // Center on origin
    vec3.sub(p, point, RenderItem.GML_ORIGIN);
    // Apply tag transform
    vec3.transformMat3(p, p, this.tagEnvironment.getTransform());
    // Note: Tag environment offset describes physical position in world space,
    // not rendering offset. It is not applied here.
    // Apply user transform
    vec3.transformMat3(p, p, this.clientEnvironment.getTransform());
    // Transform to screen space
    vec3.mul(p, p, this.clientScreenBounds);
    // Offset to center in screen space
    vec3.add(p, p, this.clientEnvironment.getScreenCenter());
    // Apply client offset
    vec3.add(p, p, this.clientEnvironment.getOffset());
  }

  private static getScreenRatioTransform(innerScreenBounds: vec2, outerScreenBounds: vec2) {
    const m = mat3.create();
    let [boundsWidth, boundsHeight] = innerScreenBounds;
    if (!Number.isFinite(boundsWidth) || boundsWidth <= 0) {
      boundsWidth = outerScreenBounds[0];
    }
    if (!Number.isFinite(boundsHeight) || boundsHeight <= 0) {
      boundsHeight = outerScreenBounds[1];
    }
    let dx = boundsWidth / outerScreenBounds[0];
    let dy = boundsHeight / outerScreenBounds[1];
    let s = 1;
    if (dx > 1 || dy > 1 || (dx < 1 && dy < 1)) {
      s = 1.0 / Math.max(dy, dx);
    }
    dx *= s;
    dy *= s;
    return mat3.fromScaling(m, [dx, dy]);
  }
}
