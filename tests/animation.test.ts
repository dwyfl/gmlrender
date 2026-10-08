import { describe, test, expect, vi, afterEach } from "vite-plus/test";
import { GML } from "gmljs";
import { GMLAnimation } from "../src/animation/animation.ts";

// Three points at 0 s, 0.5 s and 1 s.
const GML_1S = new GML(
  "<gml><tag><drawing><stroke><pt><x>0</x><y>0</y><t>0</t></pt><pt><x>0.5</x><y>0.5</y><t>0.5</t></pt><pt><x>1</x><y>1</y><t>1</t></pt></stroke></drawing></tag></gml>",
);

function createAnimation() {
  const animation = new GMLAnimation(GML_1S);
  const events: string[] = [];
  for (const type of ["start", "stop", "restart"] as const) {
    animation.addEventListener(type, () => events.push(type));
  }
  return { animation, events };
}

describe("GMLAnimation.tick", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("advances time and frames by the elapsed milliseconds", () => {
    const { animation } = createAnimation();
    animation.start(1000);
    animation.tick(1600);
    expect(animation.time).toBeCloseTo(0.6);
    expect(animation.frame).toBe(1);
  });

  test("applies the playback speed", () => {
    const { animation } = createAnimation();
    animation.setSpeed(2);
    animation.start(0);
    animation.tick(300);
    expect(animation.time).toBeCloseTo(0.6);
    expect(animation.frame).toBe(1);
  });

  test("ignores frame timestamps earlier than the start time", () => {
    const { animation } = createAnimation();
    animation.start(1000);
    animation.tick(990);
    expect(animation.time).toBe(0);
  });

  test("does nothing while stopped", () => {
    const { animation } = createAnimation();
    animation.tick(5000);
    expect(animation.time).toBe(0);
    expect(animation.isPlaying).toBe(false);
  });

  test("looping playback waits for the restart delay, then restarts", () => {
    const { animation, events } = createAnimation();
    animation.start(0);
    animation.tick(1000); // reaches the last frame
    expect(animation.frame).toBe(2);
    animation.tick(1500); // still within the 1 s restart delay
    expect(animation.frame).toBe(2);
    expect(events).toEqual(["start"]);
    animation.tick(2000);
    expect(events).toEqual(["start", "restart"]);
    expect(animation.frame).toBe(0);
    expect(animation.time).toBe(0);
    expect(animation.isPlaying).toBe(true);
  });

  test("non-looping playback stops at the last frame", () => {
    const { animation, events } = createAnimation();
    animation.setLoop(false);
    animation.start(0);
    animation.tick(1000);
    expect(events).toEqual(["start", "stop"]);
    expect(animation.isPlaying).toBe(false);
    expect(animation.frame).toBe(2);
  });

  test("start() at the last frame starts over from the beginning", () => {
    const { animation } = createAnimation();
    animation.setLoop(false);
    animation.start(0);
    animation.tick(1000);
    animation.start(5000);
    expect(animation.frame).toBe(0);
    expect(animation.time).toBe(0);
    expect(animation.isPlaying).toBe(true);
  });

  test("stop() cancels a pending restart", () => {
    const { animation, events } = createAnimation();
    animation.start(0);
    animation.tick(1000);
    animation.stop();
    animation.tick(5000);
    expect(events).toEqual(["start", "stop"]);
  });

  test("schedules no timers of its own", () => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "performance", "Date"],
    });
    const { animation } = createAnimation();
    animation.start();
    animation.tick(1000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
