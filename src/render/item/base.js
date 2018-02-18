import { vec3, mat3 } from '../../vendor/gl-matrix';
import { TagEnvironment } from '../../environment';
import { DefaultRenderProps } from '../props';

const CENTER_POINT = vec3.fromValues(0.5, 0.5, 0);

export default class RenderItem {
  constructor(gml) {
    this.gml = gml;
    this.renderProps = new DefaultRenderProps();
    this.projectionEnvs = {};
    this.tagEnvironments = this.gml.getTags().map(
      item => new TagEnvironment(item)
    );
  }
  render(renderContext, renderState) { // eslint-disable-line no-unused-vars
    throw new Error('RenderItem::render() must be overloaded in subclass.');
  }
  getType() {
    throw new Error('RenderItem::getType() must be overloaded in subclass.');
  }
  getRenderProps() {
    return this.renderProps.toObject();
  }
  getTagEnvironment(tag) {
    return this.tagEnvironments[tag];
  }
  initProjectionTransforms(tagEnvironment, clientEnvironment) {
    const clientScreenBounds = vec3.create();
    const screenRatioTransform = RenderItem._getScreenRatioTransform(
      tagEnvironment.getScreenBounds(),
      clientEnvironment.getScreenBounds()
    );
    vec3.transformMat3(
      clientScreenBounds,
      clientEnvironment.getScreenBounds(),
      screenRatioTransform
    );
    this.projectionEnvs = {
      tagEnvironment,
      clientEnvironment,
      clientScreenBounds,
      clientScreenScale: vec3.length(clientScreenBounds),
    };
  }
  projectPoint(p, point) {
    const tEnv = this.projectionEnvs.tagEnvironment;
    const cEnv = this.projectionEnvs.clientEnvironment;
    p[0] = point.values.x;
    p[1] = point.values.y;
    p[2] = point.values.z;
    // Center on origin
    vec3.sub(p, p, CENTER_POINT);
    // Apply tag transform
    vec3.transformMat3(p, p, tEnv.getTransform());
    // Apply tag offset
    vec3.add(p, p, tEnv.getOffset());
    // Apply user transform
    vec3.transformMat3(p, p, cEnv.getTransform());
    // Transform to screen space
    vec3.mul(p, p, this.projectionEnvs.clientScreenBounds);
    // Offset to center in screen space
    vec3.add(p, p, cEnv.getScreenCenter());
    // Apply client offset
    vec3.add(p, p, cEnv.getOffset());
  }
  static _getScreenRatioTransform(innerScreenBounds, outerScreenBounds) {
    const m = mat3.create();
    let boundsWidth = parseFloat(innerScreenBounds[0]);
    let boundsHeight = parseFloat(innerScreenBounds[1]);
    if (isNaN(boundsWidth) || boundsWidth <= 0)
      boundsWidth = outerScreenBounds[0];
    if (isNaN(boundsHeight) || boundsHeight <= 0)
      boundsHeight = outerScreenBounds[1];
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