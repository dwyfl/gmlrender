import { describe, it, type TestContext } from "node:test";
import { GML } from "gmljs";
import { GMLTimeline } from "../timeline";

const assertClose = (
  t: TestContext,
  actual: number,
  expected: number,
  tolerance = 1e-6
) => {
  t.assert.ok(Math.abs(actual - expected) < tolerance);
};

const xmlWithTimes =
  "<gml><tag><drawing><stroke><pt><x>0</x><y>0</y><t>0</t></pt><pt><x>3</x><y>4</y><t>2</t></pt></stroke></drawing></tag></gml>";

const xmlWithoutTimes =
  "<gml><tag><drawing><stroke><pt><x>0</x><y>0</y></pt><pt><x>1</x><y>0</y></pt></stroke></drawing></tag></gml>";

const xmlTwoStrokes =
  "<gml><tag><drawing><stroke><pt><x>0</x><y>0</y></pt></stroke><stroke><pt><x>1</x><y>1</y></pt></stroke></drawing></tag></gml>";

describe("GMLTimeline", () => {
  it("creates an empty timeline for a default GML", (t: TestContext) => {
    const timeline = new GMLTimeline(new GML()).timelines;
    t.assert.strictEqual(timeline.length, 1);
    t.assert.strictEqual(timeline[0]?.length, 0);
  });

  it("uses point timestamps when present", (t: TestContext) => {
    const timeline = new GMLTimeline(new GML(xmlWithTimes)).timelines[0] ?? [];
    t.assert.strictEqual(timeline.length, 2);
    t.assert.strictEqual(timeline[0]?.t, 0);
    t.assert.strictEqual(timeline[1]?.t, 2);
    t.assert.strictEqual(timeline[0]?.speed, 0);
    assertClose(t, timeline[1]?.speed ?? 0, 2500);
    assertClose(t, timeline[1]?.direction.x ?? 0, -0.6);
    assertClose(t, timeline[1]?.direction.y ?? 0, -0.8);
  });

  it("fills missing timestamps using fps", (t: TestContext) => {
    const timeline = new GMLTimeline(new GML(xmlWithoutTimes)).timelines[0] ?? [];
    t.assert.strictEqual(timeline.length, 2);
    assertClose(t, timeline[0]?.t ?? -1, 0);
    assertClose(t, timeline[1]?.t ?? -1, 1 / 60);
  });

  it("uses custom fps when enabled", (t: TestContext) => {
    const timeline = new GMLTimeline(new GML(xmlWithTimes), {
      useCustomFps: true,
      fps: 10,
    }).timelines[0];
    t.assert.strictEqual(timeline?.[0]?.t, 0);
    assertClose(t, timeline?.[1]?.t ?? -1, 0.1);
  });

  it("tracks tag, drawing, stroke, and point indices", (t: TestContext) => {
    const timeline = new GMLTimeline(new GML(xmlTwoStrokes)).timelines[0] ?? [];
    t.assert.strictEqual(timeline.length, 2);
    t.assert.deepStrictEqual(
      [timeline[0]?.tag, timeline[0]?.drawing, timeline[0]?.stroke, timeline[0]?.point],
      [0, 0, 0, 0]
    );
    t.assert.deepStrictEqual(
      [timeline[1]?.tag, timeline[1]?.drawing, timeline[1]?.stroke, timeline[1]?.point],
      [0, 0, 1, 0]
    );
  });
});
