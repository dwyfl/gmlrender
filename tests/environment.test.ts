import { describe, test, expect } from "vite-plus/test";
import { GML } from "gmljs";
import { mat3, vec3 } from "gl-matrix";
import { TagEnvironment } from "../src/environment/tag.ts";

function tagEnvironment({ up, client }: { up?: number[]; client?: string }) {
  const header = client
    ? `<header><client><name>${client}</name></client></header>`
    : "";
  const environment = up
    ? `<environment><up><x>${up[0]}</x><y>${up[1]}</y><z>${up[2] ?? 0}</z></up></environment>`
    : "";
  const gml = new GML(
    `<gml><tag>${header}${environment}<drawing><stroke><pt><x>0</x><y>0</y></pt></stroke></drawing></tag></gml>`,
  );
  return new TagEnvironment(gml.getTags()[0]!);
}

function transform(env: TagEnvironment, v: [number, number, number]) {
  const out = vec3.create();
  vec3.transformMat3(out, vec3.fromValues(...v), env.getTransform());
  // Matrices are float32: round away float noise (and -0).
  return Array.from(out).map((n) => Math.round(n * 1e6) / 1e6 + 0);
}

const SCREEN_UP = [0, -1, 0];

describe("TagEnvironment up vector", () => {
  // The up vectors used by real GML files (from a survey of ~29,500 documents).
  test("(1,0,0) — Fat Tag / DustTag — rotates x to screen up", () => {
    const env = tagEnvironment({ up: [1, 0, 0] });
    expect(transform(env, [1, 0, 0])).toEqual(SCREEN_UP);
    expect(transform(env, [0, 1, 0])).toEqual([1, 0, 0]);
    // Exact matrix, so renders are pixel-stable.
    expect(Array.from(env.getTransform())).toEqual([
      0, -1, 0, 1, 0, 0, 0, 0, 1,
    ]);
  });

  test("(0,-1,0) — TouchTag — is already screen up (no rotation)", () => {
    const env = tagEnvironment({ up: [0, -1, 0] });
    expect(Array.from(env.getTransform())).toEqual(Array.from(mat3.create()));
  });

  test.each([
    ["(0,0,0)", [0, 0, 0]],
    ["no <up>", undefined],
  ])("%s means no rotation", (_, up) => {
    const env = tagEnvironment({ up });
    expect(Array.from(env.getTransform())).toEqual(Array.from(mat3.create()));
    expect(Array.from(env.getUpVector())).toEqual(SCREEN_UP);
  });

  test("DustTag and Fat Tag documents without <up> default to (1,0,0)", () => {
    for (const client of [
      "Graffiti Analysis 2.0: DustTag",
      "DustTag: Graffiti Analysis 2.0",
      "Fat Tag - Katsu Edition",
    ]) {
      const env = tagEnvironment({ client });
      expect(Array.from(env.getUpVector())).toEqual([1, 0, 0]);
      expect(transform(env, [1, 0, 0])).toEqual(SCREEN_UP);
    }
  });

  test.each([
    [[-1, 0, 0]],
    [[0, 1, 0]],
    [[0.5, 0, 0]],
    [[1, 1, 0]],
    [[3, -4, 7]],
  ])("rotates any up vector %j to screen up without scaling", (up) => {
    const env = tagEnvironment({ up });
    const [x, y] = up as [number, number];
    const length = Math.hypot(x, y);
    expect(transform(env, [x / length, y / length, 0])).toEqual(SCREEN_UP);
    // A pure rotation keeps lengths and has determinant 1.
    expect(mat3.determinant(env.getTransform())).toBeCloseTo(1);
    expect(
      vec3.length(
        vec3.fromValues(
          ...(transform(env, [1, 0, 0]) as [number, number, number]),
        ),
      ),
    ).toBeCloseTo(1);
  });

  test("an up vector along z only means no rotation", () => {
    const env = tagEnvironment({ up: [0, 0, 1] });
    expect(Array.from(env.getTransform())).toEqual(Array.from(mat3.create()));
  });
});
