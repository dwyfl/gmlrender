# gmlrender

- It's can render [GML (Graffiti Markup Language)](https://en.wikipedia.org/wiki/Graffiti_Markup_Language) documents.
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

```typescript
import { readFileSync, writeFileSync } from "node:fs";
import { GML } from "gmljs";
import { GMLViewStatic } from "gmlrender";

const gml = new GML(readFileSync("tag.gml", "utf8"));
const view = new GMLViewStatic(gml, { width: 1024, height: 768 });

// Get a PNG data URL
const dataURL = view.render("png");

// Write it to a file
const base64 = dataURL.replace(/^data:image\/[a-z]+;base64,/, "");
writeFileSync("tag.png", base64, "base64");
```

Options:

| Option       | Type     | Default | Description                                        |
| ------------ | -------- | ------- | -------------------------------------------------- |
| `width`      | `number` | `640`   | Output width in pixels                             |
| `height`     | `number` | `480`   | Output height in pixels                            |
| `background` | `string` | `#fff`  | CSS color string for the background                |
| `progress`   | `number` | `1`     | Fraction of the drawing to render, from `0` to `1` |
| `quality`    | `number` | `0.6`   | JPEG/WebP compression quality, from `0` to `1`     |

## CLI

Using `gmlrender` on the command line is simple.

```
$ gmlrender  --help
Usage: gmlrender [options] <input> [output]

Render GML documents to images

Arguments:
  input                        GML document input
  output                       image output

Options:
  -V, --version                output the version number
  -w, --width <n>              output width (default: 1024)
  -h, --height <n>             output height (default: 768)
  -b, --background <hexcolor>  background color (default: "white")
  -f, --format <format>        output format (choices: "png", "jpg", default: "png")
  --help                       print help text

$ gmlrender ~/nyc/zephyr.gml
✅ Rendered 1024x768 png file: ~/nyc/zephyr.png
$ gmlrender ~/nyc/cope2.gml -w 1920 -h 1080 --format jpg --background #aaddff
✅ Rendered 1920x1080 jpg file: ~/nyc/cope2.png
```
