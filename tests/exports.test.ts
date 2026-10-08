import { describe, test, expect } from "vite-plus/test";
import { GML as GmljsGML } from "gmljs";
import * as root from "../src/index.ts";
import { createGMLImage, createGMLView } from "../src/server/index.ts";
import { RenderItem } from "../src/render/item/index.ts";
import type { RenderContextBase } from "../src/render/context.ts";
import type { RenderState } from "../src/render/state.ts";
import packageJson from "../package.json" with { type: "json" };

const SIMPLE_GML =
  "<gml><tag><drawing><stroke><pt><x>0.1</x><y>0.1</y><t>0</t></pt><pt><x>0.9</x><y>0.9</y><t>1</t></pt></stroke></drawing></tag></gml>";

describe("Root exports", () => {
  test("re-exports gmljs' GML class", () => {
    expect(root.GML).toBe(GmljsGML);
  });

  test("exports the runtime API", () => {
    expect(Object.keys(root).sort()).toEqual([
      "GML",
      "GMLParseError",
      "GMLRenderer",
      "GMLView",
      "RenderContextBase",
    ]);
  });
});

describe("GMLView.getRenderItem", () => {
  test("returns the concrete built-in render item types", () => {
    const view = createGMLView(SIMPLE_GML, {
      type: "node-canvas",
      width: 10,
      height: 10,
    });
    const drips = view.getRenderItem("drips")?.item;
    // No cast needed: the type is RenderItemDrips.
    drips?.setOptions({ dripFactor: 0.5 });
    expect(drips?.type).toBe("drips");
    expect(view.getRenderItem("tags")?.item.type).toBe("tags");
    expect(view.getRenderItem("background")?.item.type).toBe("background");
  });

  test("returns undefined for an unknown type", () => {
    const view = createGMLView(SIMPLE_GML, {
      type: "node-canvas",
      width: 10,
      height: 10,
    });
    expect(view.getRenderItem("unknown")).toBeUndefined();
  });

  test("does not return a custom item that reuses a built-in type name", () => {
    class FakeDrips extends RenderItem {
      override get type() {
        return "drips";
      }
      render(_context: RenderContextBase, _state: RenderState) {}
    }
    const view = createGMLView(SIMPLE_GML, {
      type: "node-canvas",
      width: 10,
      height: 10,
    });
    const { renderer } = view;
    renderer.removeRenderItem(
      renderer.items.findIndex(({ item }) => item.type === "drips"),
    );
    renderer.addRenderItem(new FakeDrips(new GmljsGML(SIMPLE_GML)));
    expect(view.getRenderItem("drips")).toBeUndefined();
  });
});

describe("package.json", () => {
  test("native and video backends are optional peer dependencies", () => {
    const pkg: {
      dependencies: Record<string, string>;
      peerDependenciesMeta: Record<string, { optional: boolean }>;
    } = packageJson;
    for (const name of ["canvas", "skia-canvas", "mediabunny"]) {
      expect(pkg.dependencies).not.toHaveProperty(name);
      expect(pkg.peerDependenciesMeta[name]?.optional).toBe(true);
    }
  });
});

describe("Parsing", () => {
  test("malformed XML rejects with GMLParseError", async () => {
    await expect(
      createGMLImage("<gml><tag></gml>", {
        type: "node-canvas",
        width: 10,
        height: 10,
      }),
    ).rejects.toBeInstanceOf(root.GMLParseError);
  });

  test("a missing render backend rejects instead of throwing", async () => {
    const promise = createGMLImage("<gml></gml>", {
      // @ts-expect-error an unknown render context type
      type: "no-such-canvas",
      width: 10,
      height: 10,
    });
    await expect(promise).rejects.toThrow(
      'Invalid render context type "no-such-canvas"',
    );
  });

  test("invalid values are skipped and reported in view.gml.warnings", () => {
    const view = createGMLView(
      "<gml><tag><drawing><stroke><pt><x>0.1</x><y>0.1</y></pt><pt><x>oops</x><y>0.2</y></pt><pt><x>0.3</x><y>0.3</y></pt></stroke></drawing></tag></gml>",
      { type: "node-canvas", width: 10, height: 10 },
    );
    expect(view.state.totalFrames).toBe(2);
    expect(view.gml.warnings.length).toBeGreaterThan(0);
    expect(view.gml.warnings[0]).toBeInstanceOf(root.GMLParseError);
  });
});
