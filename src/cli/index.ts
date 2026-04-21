#!/usr/bin/env node
import { program, Option } from "commander";
import fs from "node:fs";
import path from "node:path";
import { GML } from "gmljs";
import { GMLViewStatic } from "../view-static.ts";
import packageJson from "../../package.json" with { type: "json" };

program
  .name("gmlrender")
  .description("Render GML documents to images.")
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
    new Option("-f, --format <format>", "output format").choices(["png", "jpg"]).default("png"),
  )
  .parse(process.argv);

const options = program.opts();
const { format, width, height, out } = options;
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
    const preview = new GMLViewStatic(new GML(document), options);
    const image = preview.render(format);

    fs.writeFileSync(outFile, image.replace(/^data:image\/[a-z]+;base64,/, ""), "base64");

    console.log(`✅ Rendered ${width}x${height} ${format} file: ${outFile}`);
  } catch (err) {
    hasError = true;
    console.error(
      `❌ Failed to render ${file}: ${err instanceof Error ? err.message : "Unknown Error"}`,
    );
  }
}

process.exit(hasError ? 1 : 0);
