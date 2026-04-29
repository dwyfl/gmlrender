import { vec3 } from "gl-matrix";
import { GML } from "gmljs";
import {
  GMLTimeline,
  type GMLTagTimeline,
  type GMLTagTimelineFrame,
} from "../../animation/timeline.ts";
import { RenderContextBase } from "../context.ts";
import { RenderItem } from "./base.ts";
import { ForegroundRenderProps } from "../props/foreground.ts";
import { RenderState } from "../state.ts";

// Scales probability so that dripFactor=0.2 yields roughly 4-8 drips per tag
const DRIP_SCALE = 2;

const DEFAULT_OPTIONS: DripOptions = {
  dripFactor: 0.2,
  dripLength: 0.2, // GML virtual unit
  dripSpeed: 4, // Seconds to reach full lengt
  dripEasing: (t: number) => 2 - 2 / (Math.min(1, Math.max(0, t)) + 1),
};

export interface DripOptions {
  dripFactor: number;
  dripLength: number;
  dripSpeed: number;
  dripEasing: (t: number) => number;
}

interface DripPoint {
  tagIndex: number;
  drawingIndex: number;
  strokeIndex: number;
  pointIndex: number;
  t: number; // Timestamp when this drip starts flowing
  xyz: [number, number, number]; // GML virtual space coordinates
  dripLength: number; // Max length (GML virtual units)
  dripSpeed: number; // Seconds to reach full length
}

/**
 * Mulberry32 PRNG — fast, deterministic, good distribution.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derives a deterministic integer seed from a few sampled GML point coordinates.
 */
function computeGMLSeed(gml: GML): number {
  let seed = 12345;
  const tags = gml.getTags();
  for (let t = 0; t < Math.min(3, tags.length); t++) {
    const drawings = gml.getDrawings(t) ?? [];
    for (let d = 0; d < Math.min(2, drawings.length); d++) {
      const strokes = gml.getStrokes(t, d) ?? [];
      for (let s = 0; s < Math.min(2, strokes.length); s++) {
        const points = gml.getPoints(t, d, s) ?? [];
        for (let p = 0; p < Math.min(3, points.length); p++) {
          const xyz = points[p].getXYZ();
          seed = (Math.imul(seed, 1664525) + Math.round((xyz[0] ?? 0) * 100000)) | 0;
          seed = (Math.imul(seed, 1664525) + Math.round((xyz[1] ?? 0) * 100000)) | 0;
        }
      }
    }
  }
  return seed >>> 0;
}

/**
 * Returns true if the drip should be visible at the current animation frame.
 * A drip is visible once the pen has passed its origin point.
 */
function isDripVisible(drip: DripPoint, frame: GMLTagTimelineFrame): boolean {
  if (drip.tagIndex < frame.tag) return true;
  if (drip.tagIndex > frame.tag) return false;
  if (drip.drawingIndex < frame.drawing) return true;
  if (drip.drawingIndex > frame.drawing) return false;
  if (drip.strokeIndex < frame.stroke) return true;
  if (drip.strokeIndex > frame.stroke) return false;
  return drip.pointIndex <= frame.point;
}

export class RenderItemDrips extends RenderItem {
  private options: DripOptions;
  private _dripPoints: DripPoint[];
  private p1: vec3;
  private p2: vec3;
  private _startVec: vec3;
  private _endVec: vec3;

  constructor(gml: GML) {
    super(gml);
    this.renderProps = new ForegroundRenderProps();
    this.options = { ...DEFAULT_OPTIONS };
    this.p1 = vec3.create();
    this.p2 = vec3.create();
    this._startVec = vec3.create();
    this._endVec = vec3.create();
    this._dripPoints = this._calculateDripPoints();
  }

  get type() {
    return "drips";
  }

  setOptions(options: Partial<DripOptions>) {
    if (options.dripFactor !== undefined && !isNaN(options.dripFactor)) {
      this.options.dripFactor = Math.min(1, Math.max(0, options.dripFactor));
    }
    if (options.dripLength !== undefined && !isNaN(options.dripLength)) {
      this.options.dripLength = Math.min(10, Math.max(0, options.dripLength));
    }
    if (options.dripSpeed !== undefined && !isNaN(options.dripSpeed)) {
      this.options.dripSpeed = Math.min(3600, Math.max(0, options.dripSpeed));
    }
    if (options.dripEasing !== undefined && typeof options.dripEasing === "function") {
      this.options.dripEasing = options.dripEasing;
    }
    this._dripPoints = this._calculateDripPoints();
  }

  private static _prngRatio(prng: () => number, value: number, ratio: number): number {
    ratio = Math.max(0, Math.min(1, ratio));
    return value * (1 - ratio) + value * ratio * prng();
  }

  /**
   * Returns the drip direction vector (in GML virtual space) for a given tag.
   * Drips flow opposite to the environment's up vector.
   */
  private _getDripDirection(tagIndex: number): vec3 {
    return this.getTagEnvironment(tagIndex).getUpVector();
  }

  /**
   * Scores each frame in a tag's timeline by how likely it is to be a good drip
   * origin. Higher score = more interesting from a paint-physics standpoint.
   *
   * Criteria:
   *   - Stroke start or end (paint pools at rest)
   *   - Large direction change (paint flings off at corners)
   *   - Significant speed slowdown (paint accumulates when the writer slows)
   */
  private _scoreTimeline(timeline: GMLTagTimeline): number[] {
    const scores: number[] = Array.from({ length: timeline.length }, () => 0);

    for (let i = 0; i < timeline.length; i++) {
      const frame = timeline[i];
      const prev = i > 0 ? timeline[i - 1] : null;
      const next = i < timeline.length - 1 ? timeline[i + 1] : null;

      let score = 0;

      // Stroke boundary: paint pools at start and end of each stroke
      const isStrokeStart = frame.point === 0;
      const isStrokeEnd = !next || next.stroke !== frame.stroke || next.drawing !== frame.drawing;

      if (isStrokeStart || isStrokeEnd) {
        score += 1.0;
      }

      // Direction change within the same stroke (> 30°)
      if (prev && prev.stroke === frame.stroke && prev.drawing === frame.drawing) {
        const d1 = prev.direction;
        const d2 = frame.direction;
        const len1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
        const len2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);
        if (len1 > 0 && len2 > 0) {
          const dot = (d1.x * d2.x + d1.y * d2.y) / (len1 * len2);
          const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
          if (angle > Math.PI / 6) {
            score += (angle / Math.PI) * 0.8;
          }
        }
      }

      // Speed slowdown within the same stroke (> 40% drop)
      if (prev && prev.stroke === frame.stroke && prev.speed > 0 && frame.speed > 0) {
        const speedRatio = frame.speed / prev.speed;
        if (speedRatio < 0.6) {
          score += (1 - speedRatio) * 0.6;
        }
      }

      scores[i] = score;
    }

    return scores;
  }

  private _calculateDripPoints(): DripPoint[] {
    const prng = mulberry32(computeGMLSeed(this.gml));
    const dripPoints: DripPoint[] = [];
    const timelines = new GMLTimeline(this.gml).timelines;

    for (let tagIndex = 0; tagIndex < timelines.length; tagIndex++) {
      const timeline = timelines[tagIndex];
      if (!timeline.length) continue;

      const scores = this._scoreTimeline(timeline);

      for (let i = 0; i < timeline.length; i++) {
        const score = scores[i];
        if (score <= 0) continue;

        // Probability capped at 1; DRIP_SCALE tunes the expected count
        const probability = Math.min(1, score * this.options.dripFactor * DRIP_SCALE);
        if (prng() >= probability) continue;

        const frame = timeline[i];
        const point = this.gml.getPoint(frame.tag, frame.drawing, frame.stroke, frame.point);
        if (!point) continue;

        const xyz = point.getXYZ();
        dripPoints.push({
          tagIndex,
          drawingIndex: frame.drawing,
          strokeIndex: frame.stroke,
          pointIndex: frame.point,
          t: frame.t,
          xyz: [xyz[0] ?? 0, xyz[1] ?? 0, xyz[2] ?? 0],
          dripLength: RenderItemDrips._prngRatio(prng, this.options.dripLength, 0.9),
          dripSpeed: RenderItemDrips._prngRatio(prng, this.options.dripSpeed, 0.5),
        });
      }
    }

    return dripPoints;
  }

  render(renderContext: RenderContextBase, renderState: RenderState): void {
    if (!this._dripPoints.length) return;

    const { frame, time } = renderState.animationState;
    if (!frame) return;

    renderContext.beginPath();
    renderContext.setRenderProps({
      lineWidth:
        (renderState.getRenderOption("lineWidth") ?? 2) * renderState.clientEnvironment.scale,
    });

    const { p1, p2, _startVec: start, _endVec: end } = this;

    for (const drip of this._dripPoints) {
      if (!isDripVisible(drip, frame)) continue;

      const elapsed = time - drip.t;
      const length = drip.dripLength * this.options.dripEasing(elapsed / drip.dripSpeed);
      if (length <= 0) continue;

      this.initProjectionTransforms(
        this.getTagEnvironment(drip.tagIndex),
        renderState.clientEnvironment,
      );

      const dripDir = this._getDripDirection(drip.tagIndex);

      vec3.set(start, drip.xyz[0], drip.xyz[1], drip.xyz[2]);
      vec3.set(
        end,
        drip.xyz[0] + dripDir[0] * length,
        drip.xyz[1] + dripDir[1] * length,
        drip.xyz[2] + dripDir[2] * length,
      );

      this.projectPoint(p1, start);
      this.projectPoint(p2, end);

      renderContext.moveTo(p1[0], p1[1]);
      renderContext.lineTo(p2[0], p2[1]);
    }

    renderContext.stroke();
  }
}
