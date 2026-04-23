#!/usr/bin/env node
import { program, Option } from "commander";
import fs from "node:fs";
import path from "node:path";
import packageJson from "../../package.json" with { type: "json" };
import { createGMLViewStatic } from "../server/index.ts";
import { renderToVideo } from "../render/video.ts";
import { createGMLView } from "../server/factory.ts";

program
  .name("gmlrender")
  .description("Render GML documents to images or video.")
  .usage("[options] <file> ...")
  .version(packageJson.version)
  .showHelpAfterError()
  .helpOption("--help", "print help text")
  .argument("<file...>", "GML document file(s)")
  .option("-o, --out <path>", "target file or directory")
  .option("-w, --width <size>", "force image width", (v) => parseInt(v, 10), 1024)
  .option("-h, --height <size>", "force image height", (v) => parseInt(v, 10), 768)
  .option("-b, --background <hexcolor>", "background color", "white")
  .addOption(
    new Option("-f, --format <format>", "output format")
      .choices(["png", "jpg", "webp"])
      .default("png"),
  )
  .optionsGroup("Video options")
  .option("--fps <fps>", "frames per second", (v) => parseInt(v, 10), 30)
  .option("--lossless", "use lossless WebP encoding")
  .parse(process.argv);

const options = program.opts();
const { format, width, height, out, fps, lossless, background } = options;
const files = program.args;

if (out && !fs.existsSync(out) && files.length > 1) {
  console.error(`❌ Directory "${out}" does not exist.`);
  process.exit(1);
}

let hasError = false;

for (const file of files) {
  try {
    if (!fs.existsSync(file) || !fs.lstatSync(file).isFile()) {
      throw new Error(`"${file}" is not a file.`);
    }
    if (out && !fs.existsSync(out) && files.length > 1) {
      throw new Error(`"${out}" is not a directory.`);
    }

    let outFile = `${file.replace(/\.(?:gml|xml)$/i, "")}.${format}`;

    if (out) {
      const gmlFileExt = `${path.basename(file).replace(/\.(?:gml|xml)$/i, "")}.${format}`;
      if (files.length > 1) {
        // out is a directory
        outFile = path.join(out, gmlFileExt);
      } else {
        // out can be both file/directory
        if (fs.existsSync(out)) {
          outFile = fs.lstatSync(out).isDirectory() ? path.join(out, gmlFileExt) : out;
        } else {
          if (!fs.existsSync(path.dirname(out))) {
            throw new Error(`Cannot write "${out}", directory does not exist.`);
          }
          outFile = out;
        }
      }
    }

    const document = fs.readFileSync(file, "utf8");
    const opts = { background };

    let data: Uint8Array | Buffer;
    if (format === "webp") {
      const view = createGMLView(document, width, height, "canvas", opts);
      data = await renderToVideo(view, { fps, lossless });
    } else {
      const view = createGMLViewStatic(document, width, height, "canvas", opts);
      const image = await view.render(format);
      data = Buffer.from(await image.arrayBuffer());
    }

    fs.writeFileSync(outFile, data);

    const label = format === "webp" ? `${fps}fps webp` : `${format}`;
    console.log(`✅ Rendered ${width}x${height} ${label} file: ${outFile}`);
  } catch (err) {
    hasError = true;
    console.error(
      `❌ Failed to render ${file}: ${err instanceof Error ? err.message : "Unknown Error"}`,
    );
  }
}

process.exit(hasError ? 1 : 0);
