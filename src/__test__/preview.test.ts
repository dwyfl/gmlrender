import { describe, test, TestContext } from "node:test";
import { Preview } from "../preview";
import { GML } from "gmljs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const example000 = readFileSync(
  join(__dirname, "./data/example000.xml"),
  "utf8"
);
const example001 = readFileSync(
  join(__dirname, "./data/example001.xml"),
  "utf8"
);

describe("GMLPreview", () => {
  test("renders an empty document", (t: TestContext) => {
    const gml = new GML(example000);
    const preview = new Preview(gml, 320, 240);
    const result = preview.getPreview("image/png");
    t.assert.snapshot(result);
  });

  test("renders a basic tag", (t: TestContext) => {
    const gml = new GML(example001);
    const preview = new Preview(gml, 320, 240);
    const result = preview.getPreview("image/png");
    t.assert.snapshot(result);
  });
});
