const TIMELINE_OPTIONS = {
  useCustomFps: false,
  customFps: 1/60,
};

/**
 * A GMLTimeline is a precalculated linear array of points
 * with related metadata such as timestamp, direction and speed.
 */
export default class GMLTimeline {
  constructor(gml) {
    this.gml = gml;
  }
  getTimeline(userOptions) {
    if (!this.gml) {
      return [];
    }
    const options = Object.assign(TIMELINE_OPTIONS, userOptions);
    const context = {
      previousPointTime: 0,
      customTimeOffset: 0,
    };
    return this.gml.getTags().map((tagNode, tagIndex) => {
      let frames = [];
      context.tag = tagIndex;
      tagNode.getDrawings().forEach((drawingNode, drawingIndex) => {
        context.drawing = drawingIndex;
        drawingNode.getStrokes().forEach((strokeNode, strokeIndex) => {
          context.stroke = strokeIndex;
          if (frames.length) {
            const currentFrame = frames.length;
            const previousFrame = frames.length - 1;
            context.customTimeOffset = currentFrame * options.customFps;
            context.previousPointTime = isNaN(frames[previousFrame].t)
              ? previousFrame * options.customFps
              : frames[previousFrame].t;
          }
          frames = frames.concat(this._getFramesForStroke(strokeNode, options, context));
        });
      });
      return frames;
    });
  }
  _getFramesForStroke(strokeNode, options, context) {
    let previousPoint;
    let previousPointTime = context.previousPointTime || 0;
    let customTimeOffset = context.customTimeOffset || 0;
    const frame = {
      tag: context.tag,
      drawing: context.drawing,
      stroke: context.stroke,
    };
    return strokeNode.getPoints().map((point, index) => {
      const currentPointTime = Math.max(
        previousPointTime,
        isNaN(point.values.t) ? customTimeOffset : point.values.t
      );
      let dx, dy, dz, dt, len, speed, direction;
      if (previousPoint) {
        const v = point.getVector();
        const pv = previousPoint.getVector();
        dt = currentPointTime - previousPointTime;
        dx = v[0] - pv[0];
        dy = v[1] - pv[1];
        dz = v[2] - pv[2];
        len = Math.sqrt((dx * dx) + (dy * dy));
        direction = {
          x: len > 0 ? dx / len : 0,
          y: len > 0 ? dy / len : 0,
          z: dz,
        };
        speed = dt > 0 ? len * 1000 / dt : 0;
      } else {
        direction = { x: 0, y: 0, z: 0 };
        speed = 0;
      }
      const result = {
        ...frame,
        point: index,
        t: options.useCustomFps ? customTimeOffset : currentPointTime,
        speed,
        direction,
      };
      customTimeOffset += options.customFps;
      previousPointTime = currentPointTime;
      previousPoint = point;
      return result;
    });
  }
}