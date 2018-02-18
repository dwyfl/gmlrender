import { vec3 } from '../../vendor/gl-matrix';
import RenderItem from './base';
import BackgroundRenderProps from '../props/background';

const p = vec3.create();
const CORNER_POINTS = [
  { values: { x: 0, y: 0, z: 0 }},
  { values: { x: 0, y: 1, z: 0 }},
  { values: { x: 1, y: 1, z: 0 }},
  { values: { x: 1, y: 0, z: 0 }},
];

export default class RenderItemBackground extends RenderItem {
  constructor(gml) {
    super(gml);
    this.renderProps = new BackgroundRenderProps();
    this.tagEnvironments.forEach(env => {
      env.setOffsetValues(0, 0); // Don't offset the background
    });
  }
  getType() {
    return 'background';
  }
  render(renderContext, renderState) {
    for (let i = 0; i < this.gml.getTags().length; ++i) {
      this.initProjectionTransforms(
        this.getTagEnvironment(i),
        renderState.clientEnvironment
      );
      this._renderBackground(renderContext);
    }
  }
  _renderBackground(renderContext) {
    renderContext.beginPath();
    for (let i = 0; i < CORNER_POINTS.length; ++i) {
      this.projectPoint(p, CORNER_POINTS[i]);
      if (i === 0) {
        renderContext.moveTo(p[0], p[1]);
      } else {
        renderContext.lineTo(p[0], p[1]);
      }
    }
    renderContext.closePath();
    renderContext.fill();
  }
}