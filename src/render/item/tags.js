import { vec3 } from 'gl-matrix';
import RenderItem from './base';
import ForegroundRenderProps from '../props/foreground';


const initVec3Array = numVectors => {
  const vectors = [];
  for (let i = 0; i < numVectors; ++i) {
    vectors.push(vec3.create());
  }
  return vectors;
};
/* 
const p = initVec3Array(8);
const t = initVec3Array(8);
const s = [
  initVec3Array(4),
  initVec3Array(4),
];
 */
const p = vec3.create();
const q = vec3.create();
const pDir = vec3.create();
const pWidth = vec3.create();
const pPartial = vec3.create();

export default class RenderItemTags extends RenderItem {
  constructor(gml) {
    super(gml);
    this.renderProps = new ForegroundRenderProps();
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
    const strokeWidth = 0.002 * this.projectionEnvs.clientScreenScale;
    for (let i = 0; i < pointLimit - 1; ++i) {
      /* let currSeg = i & 1;
      let nextSeg = ~i & 1;
      this.projectPoint(p[0], points[i]);
      this.projectPoint(p[1], points[i + 1]);
      this.projectPoint(p[2], points[i + 2]);
      this._calculateStrokeSegment(
        t[0], t[1], t[2], t[3],
        p[0], p[1],
        strokeWidth * points[i].speed,
        strokeWidth * points[i + 1].speed
      );
      this._calculateStrokeSegment(
        t[0], t[1], t[2], t[3],
        p[1], p[2],
        strokeWidth * points[i].speed,
        strokeWidth * points[i + 1].speed
      ); */

      this.projectPoint(p, points[i]);
      this.projectPoint(q, points[i + 1]);
      vec3.sub(pDir, q, p);
      vec3.set(pWidth, -pDir[1], pDir[0], pDir[2]);
      vec3.scale(pWidth, pWidth, strokeWidth / vec3.length(pWidth));
      if (i === pointLimit && i < points.length - 1) {
        var ct = points[i].t,
          nt = points[i + 1].t,
          dt = ct >= nt ? 0 : (state.time - ct) / (nt - ct);
        vec3.lerp(pPartial, p, q, dt);
      }
      else {
        vec3.copy(pPartial, q);
      }
      renderContext.beginPath();
      renderContext.moveTo(p[0] - pWidth[0], p[1] - pWidth[1]);
      renderContext.lineTo(pPartial[0] - pWidth[0], pPartial[1] - pWidth[1]);
      renderContext.lineTo(pPartial[0] + pWidth[0], pPartial[1] + pWidth[1]);
      renderContext.lineTo(p[0] + pWidth[0], p[1] + pWidth[1]);
      renderContext.closePath();
      renderContext.fill();
    }
  }
  /* _calculateStrokeSegment(s1, s2, s3, s4, p1, p2, width1, width2) {
    vec3.sub(pDir, p1, p2);
    vec3.set(t, -pDir[1], pDir[0], pDir[2]);
    const tlen = vec3.length(t);
    vec3.scale(pWidth1, t, tlen > 0 ? width1 / tlen : 0);
    vec3.scale(pWidth2, t, tlen > 0 ? width2 / tlen : 0);
    vec3.set(s1, p[0] - pWidth1[0], p[1] - pWidth1[1], 0);
    vec3.set(s2, q[0] - pWidth2[0], q[1] - pWidth2[1], 0);
    vec3.set(s3, q[0] + pWidth2[0], q[1] + pWidth2[1], 0);
    vec3.set(s4, p[0] + pWidth1[0], p[1] + pWidth1[1], 0);
  } */
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