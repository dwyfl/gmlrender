import { vec3 } from 'gl-matrix';
import RenderItem from './base';
import BackgroundRenderProps from '../props/background';

const p = vec3.create();
const CORNER_POINTS = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 1, y: 1, z: 0 },
  { x: 1, y: 0, z: 0 }
];

export default class RenderItemBackground extends RenderItem {
  constructor(gml) {
    super(gml);
    this.renderProps = new BackgroundRenderProps();
  }
  getType() {
    return 'background';
  }
  render(renderContext, renderState) {
    const tagIndex = renderState.timelineState.frame.tag;
    const tagEnvironment = this.getTagEnvironment(tagIndex);
    const clientEnvironment = renderState.clientEnvironment;
    // const screenBoundsTransform = this.getScreenBoundsTransform(
    //   tagEnvironment.screenBounds,
    //   clientEnvironment.screenBounds
    // );
    renderContext.beginPath();
    CORNER_POINTS.forEach((point, index) => {
      this._projectPoint(p, point, tagEnvironment, clientEnvironment);
      // TODO:
      // Use screenBoundsTransform
      if (index === 0) {
        renderContext.moveTo(p[0], p[1]);
      } else {
        renderContext.lineTo(p[0], p[1]);
      }
    });
    renderContext.closePath();
    renderContext.fill();
  }
}