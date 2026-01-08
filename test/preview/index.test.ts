import { test } from "node:test";
import assert from "node:assert";
import { Preview } from "../../src/preview";
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

test("creates an empty GML preview", () => {
  const gml = new GML(example000);
  const preview = new Preview(gml, 320, 240);
  const result = preview.getPreview("image/png");
  console.log(result);
  assert.ok(result.startsWith("data:image/png;base64,"));
});

test("creates a basic GML preview", () => {
  const gml = new GML(example001);
  const preview = new Preview(gml, 320, 240);
  const result = preview.getPreview("image/png");
  console.log(result);
  assert.ok(result.startsWith("data:image/png;base64,"));
});
