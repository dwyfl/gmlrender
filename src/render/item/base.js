import { vec3, mat3 } from 'gl-matrix';
import { TagEnvironment } from '../../environment';
import { DefaultRenderProps } from '../props';

const CENTER_POINT = vec3.fromValues(0.5, 0.5, 0);

export default class RenderItem {
  constructor(gml) {
    this.gml = gml;
    this.renderProps = new DefaultRenderProps();
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
    return this.getTagEnvironment[tag];
  }
  getRenderEnvironments(renderState, tagIndex) {
    const tagEnvironment = this.getTagEnvironment(tagIndex);
    const clientEnvironment = renderState.clientEnvironment;
    const screenBoundsTransform = this.getScreenBoundsTransform(
      tagEnvironment.screenBounds,
      clientEnvironment.screenBounds
    );
    return {
      tagEnvironment,
      clientEnvironment,
      screenBoundsTransform,
    };
  }
  static centerPoint(p) {
    vec3.sub(p, p, CENTER_POINT);
  }
  static applyTransform(p, m) {
    vec3.transformMat3(p, p, m);
  }
  static _projectPoint(p, point, tagEnvironment, clientEnvironment) {
    // Center in tag space
    vec3.sub(p, p, CENTER_POINT);
    // Apply tag transform
    vec3.transformMat3(p, p, tagEnvironment.getTransform());
    // Apply user transform
    vec3.transformMat3(p, p, clientEnvironment.getTransform());
    // Transform to screen space
    vec3.mul(p, p, this.clientEnvironment.getScreenBounds());
    // Apply tag offset
    // vec3.add(p, p, tagEnvironment.getOffset());
    // Center in screen space
    vec3.add(p, p, clientEnvironment.getScreenCenter());
    // Apply user offset
    vec3.add(p, p, clientEnvironment.getOffset());
  }
  static _getScreenBoundsTransform(innerScreenBounds, outerScreenBounds) {
    let m = mat3.create();
    let boundsWidth = parseFloat(innerScreenBounds[0]);
    let boundsHeight = parseFloat(innerScreenBounds[1]);
    if (isNaN(boundsWidth) || boundsWidth <= 0)
      boundsWidth = outerScreenBounds[0];
    if (isNaN(boundsHeight) || boundsHeight <= 0)
      boundsHeight = outerScreenBounds[1];
    let dx = boundsWidth / outerScreenBounds[0];
    let dy = boundsHeight / outerScreenBounds[1];
    let s = dx > 1 || dy > 1
      ? 1.0 / Math.max(dy, dx)
      : 1.0 / Math.min(dy, dx);
    dx *= s;
    dy *= s;
    return mat3.fromScaling(m, [dx, dy]);
  }
}