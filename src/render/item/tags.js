import { vec3 } from '../../vendor/gl-matrix';
import RenderItem from './base';
import ForegroundRenderProps from '../props/foreground';

const DEFAULT_LINE_WIDTH = 0.005;
const p = vec3.create();
const q = vec3.create();

export default class RenderItemTags extends RenderItem {
  constructor(gml) {
    super(gml);
    this.renderProps = new ForegroundRenderProps();
    this.lineWidth = DEFAULT_LINE_WIDTH;
  }
  getType() {
    return 'tags';
  }
  render(renderContext, renderState) {
    const tags = this.gml.getTags();
    const state = renderState.timelineState;
    const tagLimit = this._useStateLimit(state)
      ? state.frame.tag
      : tags.length - 1;
    if (renderState.hasRenderOption('lineWidth')) {
      this.lineWidth = parseFloat(renderState.getRenderOption('lineWidth'));
    }
    for (let i = 0; i <= tagLimit; ++i) {
      if (!this.gml.getDrawings(i).length) {
        continue;
      }
      this.initProjectionTransforms(
        this.getTagEnvironment(i),
        renderState.clientEnvironment
      );
      this._renderTag(renderContext, state, i, tags[i]);
    }
  }
  _renderTag(renderContext, state, tagIndex, currentTag) {
    const drawings = currentTag.children.drawing;
    const drawingLimit = this._useStateLimit(state, tagIndex)
      ? state.frame.drawing
      : drawings.length - 1;
    for (let i = 0; i <= drawingLimit; ++i) {
      if (!this.gml.getStrokes(tagIndex, i).length) {
        continue;
      }
      this._renderDrawing(renderContext, state, tagIndex, i, drawings[i]);
    }
  }
  _renderDrawing(renderContext, state, tagIndex, drawingIndex, currentDrawing) {
    const strokes = currentDrawing.children.stroke;
    const strokeLimit = this._useStateLimit(state, tagIndex, drawingIndex)
      ? state.frame.stroke
      : strokes.length - 1;
    for (let i = 0; i <= strokeLimit; ++i) {
      if (
        !strokes[i].isDrawing() ||
        !this.gml.getPoints(tagIndex, drawingIndex, i).length
      ) {
        continue;
      }
      this._renderStroke(renderContext, state, tagIndex, drawingIndex, i, strokes[i]);
    }
  }
  _renderStroke(renderContext, state, tagIndex, drawingIndex, strokeIndex, currentStroke) {
    const points = currentStroke.children.pt;
    const pointLimit = this._useStateLimit(state, tagIndex, drawingIndex, strokeIndex)
      ? state.frame.point
      : points.length - 1;
    renderContext.beginPath();
    renderContext.setRenderProps({
      lineWidth: this.lineWidth * this.projectionEnvs.clientScreenScale
    });
    for (let i = 0; i <= pointLimit; ++i) {
      this.projectPoint(p, points[i]);
      if (i == 0) {
        renderContext.moveTo(p[0], p[1]);
      } else {
        renderContext.lineTo(p[0], p[1]);
      }
      if (i == pointLimit && i < points.length - 1 && state.time > 0) {
        this.projectPoint(q, points[i + 1]);
        const ct = Math.max(points[i].values.t, 0);
        const nt = Math.max(points[i + 1].values.t, ct);
        const tt = Math.min(Math.max(state.time, ct), nt);
        const dt = ct >= nt ? 0 : (tt - ct) / (nt - ct);
        const dx = p[0] + ((q[0] - p[0]) * dt);
        const dy = p[1] + ((q[1] - p[1]) * dt);
        renderContext.lineTo(dx, dy);
      }
    }
    renderContext.stroke();
  }
  _useStateLimit(state, tagIndex, drawingIndex, strokeIndex) {
    if (!state) {
      return false;
    }
    let result = true;
    if (typeof(tagIndex) !== 'undefined') {
      result = result && tagIndex >= state.frame.tag;
    }
    if (typeof(drawingIndex) !== 'undefined') {
      result = result && drawingIndex >= state.frame.drawing;
    }
    if (typeof(strokeIndex) !== 'undefined') {
      result = result && strokeIndex >= state.frame.stroke;
    }
    return result;
  }
}