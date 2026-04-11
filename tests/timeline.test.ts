import { describe, it, expect } from "vite-plus/test";
import { GML } from "gmljs";
import { GMLTimeline } from "../src/animation/timeline.ts";

const assertClose = (actual: number, expected: number, tolerance = 1e-6) => {
  expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
};

const xmlWithTimes =
  "<gml><tag><drawing><stroke><pt><x>0</x><y>0</y><t>0</t></pt><pt><x>3</x><y>4</y><t>2</t></pt></stroke></drawing></tag></gml>";

const xmlWithoutTimes =
  "<gml><tag><drawing><stroke><pt><x>0</x><y>0</y></pt><pt><x>1</x><y>0</y></pt></stroke></drawing></tag></gml>";

const xmlTwoStrokes =
  "<gml><tag><drawing><stroke><pt><x>0</x><y>0</y></pt></stroke><stroke><pt><x>1</x><y>1</y></pt></stroke></drawing></tag></gml>";

describe("GMLTimeline", () => {
  it("creates an empty timeline for a default GML", () => {
    const timeline = new GMLTimeline(new GML()).timelines;
    expect(timeline.length).toBe(1);
    expect(timeline[0]?.length).toBe(0);
  });

  it("uses point timestamps when present", () => {
    const timeline = new GMLTimeline(new GML(xmlWithTimes)).timelines[0] ?? [];
    expect(timeline.length).toBe(2);
    expect(timeline[0]?.t).toBe(0);
    expect(timeline[1]?.t).toBe(2);
    expect(timeline[0]?.speed).toBe(0);
    assertClose(timeline[1]?.speed ?? 0, 2500);
    assertClose(timeline[1]?.direction.x ?? 0, -0.6);
    assertClose(timeline[1]?.direction.y ?? 0, -0.8);
  });

  it("fills missing timestamps using fps", () => {
    const timeline = new GMLTimeline(new GML(xmlWithoutTimes)).timelines[0] ?? [];
    expect(timeline.length).toBe(2);
    assertClose(timeline[0]?.t ?? -1, 0);
    assertClose(timeline[1]?.t ?? -1, 1 / 60);
  });

  it("uses custom fps when enabled", () => {
    const timeline = new GMLTimeline(new GML(xmlWithTimes), {
      useCustomFps: true,
      fps: 10,
    }).timelines[0];
    expect(timeline?.[0]?.t).toBe(0);
    assertClose(timeline?.[1]?.t ?? -1, 0.1);
  });

  it("tracks tag, drawing, stroke, and point indices", () => {
    const timeline = new GMLTimeline(new GML(xmlTwoStrokes)).timelines[0] ?? [];
    expect(timeline.length).toBe(2);
    expect([
      timeline[0]?.tag,
      timeline[0]?.drawing,
      timeline[0]?.stroke,
      timeline[0]?.point,
    ]).toStrictEqual([0, 0, 0, 0]);
    expect([
      timeline[1]?.tag,
      timeline[1]?.drawing,
      timeline[1]?.stroke,
      timeline[1]?.point,
    ]).toStrictEqual([0, 0, 1, 0]);
  });
});
