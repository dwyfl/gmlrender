import RenderItem from './base';
import ForegroundRenderProps from '../props/foreground';
import GMLTimeline from '../../timeline/gml';

const DEFAULT_DRIP_FACTOR = 0.2;
const DEFAULT_DRIP_LENGTH = 0.2; // GML virtual units
const DEFAULT_DRIP_SPEED = 4;    // Seconds to reach full length
const DEFAULT_DRIP_EASING = t => 2 - (2 / (Math.min(1, Math.max(0, t)) + 1));
const DEFAULT_OPTIONS = {
  dripFactor: DEFAULT_DRIP_FACTOR,
  dripLength: DEFAULT_DRIP_LENGTH,
  dripSpeed: DEFAULT_DRIP_SPEED,
  dripEasing: DEFAULT_DRIP_EASING
};
const getRandomRatio = (value, ratio) => {
  ratio = Math.max(0, Math.min(1, ratio));
  return (value * (1 - ratio)) + (value * ratio * Math.random());
};

export default class RenderItemDrips extends RenderItem {
  constructor(gml) {
    super(gml);
    this.renderProps = new ForegroundRenderProps();
    this.timelines = new GMLTimeline(gml);
    this.dripPoints = null;
    this.options = {};
    Object.keys(DEFAULT_OPTIONS).forEach(key => this.options[key] = DEFAULT_OPTIONS[key]);
  }
  getType() {
    return 'drips';
  }
  setOptions(options) {
    const opts = options === undefined || typeof options.hasOwnProperty !== 'function'
      ? {}
      : options;
    if (opts.hasOwnProperty('dripFactor') && !isNaN(opts.dripFactor))
      this.options.dripFactor = Math.min(1, Math.max(0, opts.dripFactor));
    if (opts.hasOwnProperty('dripLength') && !isNaN(opts.dripLength))
      this.options.dripLength = Math.min(10, Math.max(0, opts.dripLength));
    if (opts.hasOwnProperty('dripSpeed') && !isNaN(opts.dripSpeed))
      this.options.dripSpeed = Math.min(3600, Math.max(0, opts.dripSpeed));
    if (opts.hasOwnProperty('dripEasing') && typeof opts.dripEasing === 'function')
      this.options.dripEasing = opts.dripEasing;
    this.dripPoints = this.calculateDripPoints();
  }
  calculateDripPoints() {
    /* var tags = this.gml.getTags();
    var dripFactor = this.getDripFactor();
    var dripPoints = [];
    for (var i = 0; i < this.timeline.length; i++) {
      if (Math.random() < dripFactor*dripFactor) {
        var p = this.timeline[i];
        var point = tags[p['tag']]
          .drawing[p['drawing']]
          .stroke[p['stroke']]
          .pt[p['point']];
        dripPoints[dripPoints.length] = {
          index: i,
          t: p['t'],
          point: point,
          dripSpeed: this.getDripSpeed(),
          dripLength: this.getDripLength()
        };
      }
    }
    return dripPoints; */
  }
  getDripFactor() {
    return getRandomRatio(this.options.dripFactor, 0.1);
  }
  getDripLength() {
    return getRandomRatio(this.options.dripLength, 0.9);
  }
  getDripSpeed() {
    return getRandomRatio(this.options.dripSpeed, 0.5);
  }
  /*
  render(renderContext, renderState) {
    if (!this.dripPoints.length)
      return;

    // Find drip direction
    var dripDirection = gmlEnv.environment.up ?
      vec3.fromValues(-gmlEnv.environment.up.x, -gmlEnv.environment.up.y, -gmlEnv.environment.up.z) :
      vec3.fromValues(0, 1, 0);

    context.beginPath();
    for (var i = 0; i < this.dripPoints.length; i++) {
      if (this.dripPoints[i].index > timeIndex)
        break;
      const p = this.dripPoints[i];
      const length = p.dripLength * this.options.dripEasing((time - p.t) / p.dripSpeed);
      const start = GMLRenderHelper.getVectorFromPoint(p.point);
      const end = vec3.create();
      if (length > 0) {
        vec3.scale(dripDirection, dripDirection, length);
        vec3.add(end, start, dripDirection);
        var p1 = GMLRenderHelper.getProjectedPoint(gmlEnv, clientEnv, GMLRenderHelper.getPointFromVector(start));
        var p2 = GMLRenderHelper.getProjectedPoint(gmlEnv, clientEnv, GMLRenderHelper.getPointFromVector(end));
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
      }
    }
    context.stroke();
  }
  */
}