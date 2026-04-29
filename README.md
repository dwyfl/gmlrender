# gmlrender

- It renders [GML (Graffiti Markup Language)](https://en.wikipedia.org/wiki/Graffiti_Markup_Language) documents to images (PNG, JPG) or animations (WebP).
- It's a JavaScript library with full TypeScript support.
- It's a CLI tool.
- It's open source.

## Installation

Install `gmlrender` via npm.

```
npm install gmlrender
```

Install it globally to use it on the command line.

```
npm install -g gmlrender
```

## Example

Rendering images with `gmlrender` is simple.

### Node.js

```typescript
import { readFileSync, writeFileSync } from "node:fs";
import { createGMLImage } from "gmlrender/server";

const gml = readFileSync("tag.gml", "utf8");
const image = await createGMLImage(gml, {
  type: "node-canvas",
  width: 1024,
  height: 768,
  background: "#eee",
  format: "png",
});

writeFileSync("tag.png", Buffer.from(image));
```

## CLI

Using `gmlrender` on the command line is simple.

```
$ Usage: gmlrender [options] <file> ...

Render GML documents to images or animated WebP.

Arguments:
  file                         GML document file(s)

Options:
  -V, --version                output the version number
  -o, --out <path>             target file or directory
  -w, --width <size>           force image width (default: 1024)
  -h, --height <size>          force image height (default: 768)
  -b, --background <hexcolor>  background color (default: "white")
  -f, --format <format>        output format (choices: "png", "jpg", "webp", default: "png")
  --help                       print help text

Video options
  --fps <fps>                  frames per second (default: 30)
  --lossless                   use lossless WebP encoding

$ gmlrender ~/nyc/zephyr.gml
✅ Rendered 1024x768 png file: ~/nyc/zephyr.png
$ gmlrender ~/nyc/cope2.gml -w 1920 -h 1080 --format jpg --background #aaddff
✅ Rendered 1920x1080 jpg file: ~/nyc/cope2.png
```
