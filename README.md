# gmlrender

- It renders [GML (Graffiti Markup Language)](https://en.wikipedia.org/wiki/Graffiti_Markup_Language) documents to images (PNG, JPG), animations and videos.
- It's a JavaScript library with full TypeScript support, for Node.js and browsers.
- It's open source.

Looking for the command line tool? See [gmlrender-cli](https://github.com/dwyfl/gmlrender-cli).

## Installation

Install `gmlrender` together with the rendering backend you use. The backends are optional
peer dependencies, so you only install what you need.

| Environment                                                           | Install                             |
| --------------------------------------------------------------------- | ----------------------------------- |
| Browser                                                               | `npm install gmlrender`             |
| Browser, rendering video (`gmlrender/video`)                          | `npm install gmlrender mediabunny`  |
| Node.js with [node-canvas](https://github.com/Automattic/node-canvas) | `npm install gmlrender canvas`      |
| Node.js with [skia-canvas](https://github.com/samizdatco/skia-canvas) | `npm install gmlrender skia-canvas` |

`canvas` and `skia-canvas` download native binaries in an install script. With pnpm 10 or
later, allow them to run with `pnpm approve-builds`.

## Examples

### Node.js

```typescript
import { readFileSync, writeFileSync } from "node:fs";
import { createGMLImage } from "gmlrender/server";

const gml = readFileSync("tag.gml", "utf8");
const image = await createGMLImage(gml, {
  type: "node-canvas", // or "skia-canvas"
  width: 1024,
  height: 768,
  background: "#eee",
  format: "png",
});

writeFileSync("tag.png", Buffer.from(image));
```

### Browser

```typescript
import { createGMLView } from "gmlrender/browser";

const view = createGMLView(gml, {
  type: "html-canvas",
  canvas: document.querySelector("canvas")!,
  width: 800,
  height: 600,
  drips: true,
});
view.start();
```

### Video (browser)

```typescript
import { renderToVideo } from "gmlrender/video";

const mp4 = await renderToVideo(gml, {
  width: 1280,
  height: 720,
  format: "mp4",
});
```
