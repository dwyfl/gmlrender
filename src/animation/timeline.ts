import { GML, GMLTag, GMLStroke, GMLDrawing, GMLPoint } from "gmljs";

/**
 * A GMLTagTimelineFrame is a precalculated set of values such as timestamp, direction and speed for a point in a GML tag.
 */
export type GMLTagTimelineFrame = {
  tag: number; // Index of the tag
  drawing: number; // Index of the drawing
  stroke: number; // Index of the stroke
  point: number; // Index of the point in the stroke
  t: number; // Timestamp of the frame
  speed: number; // Speed at this point in "virtual" pixels per second
  direction: { x: number; y: number; z: number }; // Direction vector of the stroke at this point
};

/**
 * A GMLTagTimeline is an array of GMLTagTimelineFrames, making up a timeline for a specific tag.
 */
export type GMLTagTimeline = GMLTagTimelineFrame[];

type GMLTimelineCursor = {
  currentFrame: number; // Index of the current frame
  previousTimeOffset: number | undefined; // Timestamp of the previous frame
};

type GMLTimelineFrameContext = {
  cursor: GMLTimelineCursor; // Shared by all strokes of a tag, so time keeps advancing across strokes
  tag: number; // Index of the tag
  drawing: number; // Index of the drawing
  stroke: number; // Index of the stroke
};

export type GMLTimelineOptions = {
  useCustomFps: boolean; // Use custom FPS for the timeline
  fps: number; // Force custom FPS
};

export class GMLTimeline {
  /**
   * One timeline per tag is calculated.
   */
  timelines: GMLTagTimeline[] = [];
  useCustomFps: boolean;
  fps: number;

  constructor(
    gml?: GML,
    { fps, useCustomFps }: Partial<GMLTimelineOptions> = {},
  ) {
    this.useCustomFps = useCustomFps ?? false;
    this.fps = fps ?? 60;
    if (gml) {
      this.gml = gml;
    }
  }

  set gml(gml: GML) {
    this.timelines = GMLTimeline.getFramesForGml(gml, {
      fps: this.fps,
      useCustomFps: this.useCustomFps,
    });
  }

  private static getFramesForGml(
    gml: GML,
    options: GMLTimelineOptions,
  ): GMLTagTimeline[] {
    /**
     * @TODO: Use worker thread to precalculate timelines (per tag)?
     */
    return gml.getTags().map((tag, index) =>
      GMLTimeline.getFramesForTag(
        tag,
        {
          cursor: { currentFrame: 0, previousTimeOffset: undefined },
          tag: index,
          drawing: 0,
          stroke: 0,
        },
        options,
      ),
    );
  }

  private static getFramesForTag(
    tag: GMLTag,
    context: GMLTimelineFrameContext,
    options: GMLTimelineOptions,
  ) {
    return tag
      .getDrawings()
      .flatMap((drawing, index) =>
        GMLTimeline.getFramesForDrawing(
          drawing,
          { ...context, drawing: index },
          options,
        ),
      );
  }
  private static getFramesForDrawing(
    drawing: GMLDrawing,
    context: GMLTimelineFrameContext,
    options: GMLTimelineOptions,
  ) {
    return drawing
      .getStrokes()
      .flatMap((stroke, index) =>
        GMLTimeline.getFramesForStroke(
          stroke,
          { ...context, stroke: index },
          options,
        ),
      );
  }

  private static getFramesForStroke(
    stroke: GMLStroke,
    context: GMLTimelineFrameContext,
    { useCustomFps, fps }: GMLTimelineOptions,
  ) {
    const { cursor } = context;
    const FPS_SECONDS = 1 / fps;
    let previousPoint: GMLPoint | undefined;

    return stroke.getPoints().map((point, index, arr) => {
      const previousTimeOffset = cursor.previousTimeOffset ?? -FPS_SECONDS;
      const currentTimeOffset = useCustomFps
        ? cursor.currentFrame * FPS_SECONDS
        : (point.getT() ?? previousTimeOffset + FPS_SECONDS);
      const nextTimeOffset = useCustomFps
        ? (cursor.currentFrame + 1) * FPS_SECONDS
        : (arr[index + 1]?.getT() ?? currentTimeOffset + FPS_SECONDS);

      const p1 = previousPoint ?? point;
      const p2 = previousPoint ? point : arr[index + 1];
      const t1 = previousPoint ? previousTimeOffset : currentTimeOffset;
      const t2 = previousPoint ? currentTimeOffset : nextTimeOffset;

      const { speed, direction } =
        p1 && p2
          ? GMLTimeline.getSpeedAndDirection(p1, p2, t1, t2)
          : { speed: 0, direction: { x: 0, y: 0, z: 0 } };

      // Current frame data
      const result = {
        tag: context.tag,
        drawing: context.drawing,
        stroke: context.stroke,
        point: index,
        t: currentTimeOffset,
        speed: previousPoint ? speed : 0,
        direction,
      };

      // Store previous point
      previousPoint = point;

      // Advance cursor
      cursor.previousTimeOffset = currentTimeOffset;
      cursor.currentFrame++;

      return result satisfies GMLTagTimelineFrame;
    });
  }

  private static getSpeedAndDirection(
    p1: GMLPoint,
    p2: GMLPoint,
    t1: number,
    t2: number,
  ): { speed: number; direction: { x: number; y: number; z: number } } {
    const [x1, y1, z1] = p1.getXYZ();
    const [x2, y2, z2] = p2.getXYZ();
    const dt = t2 - t1;
    const dx = x1 - x2;
    const dy = y1 - y2;
    const dz = z1 - z2;
    const len = Math.sqrt(dx * dx + dy * dy);
    return {
      direction: {
        x: len > 0 ? dx / len : 0,
        y: len > 0 ? dy / len : 0,
        z: dz,
      },
      speed: dt > 0 ? (len * 1000) / dt : 0,
    };
  }
}
