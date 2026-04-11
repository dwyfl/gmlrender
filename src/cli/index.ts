#!/usr/bin/env node
import { program, Option } from "commander";
import fs from "fs";
import { GML } from "gmljs";
import { Preview } from "../preview.ts";
import packageJson from "../../package.json" with { type: "json" };

program
  .name("gmlrender")
  .description("Render GML documents to images")
  // .usage("[options] <input> [output]")
  .version(packageJson.version)
  .showHelpAfterError()
  .helpOption("--help", "print help text")
  .argument("<input>", "GML document input")
  .argument("[output]", "image output")
  .option("-w, --width <n>", "output width", (v) => parseInt(v, 10), 1024)
  .option("-h, --height <n>", "output height", (v) => parseInt(v, 10), 768)
  .option("-b, --background <hexcolor>", "background color", "white")
  .addOption(
    new Option("-f, --format <format>", "output format").choices(["png", "jpg"]).default("png"),
  )
  .parse(process.argv);

const options = program.opts();
const { format, width, height } = options;
const [input, output] = program.args;
const inFile = input;
const outFile = output || `${inFile.replace(/\.(?:gml|xml)$/i, "")}.${format}`;

const document = fs.readFileSync(inFile, "utf8");
const preview = new Preview(new GML(document), options);
const image = preview.getPreview(format);

fs.writeFileSync(outFile, image.replace(/^data:image\/[a-z]+;base64,/, ""), "base64");

console.log(`✅ Rendered ${width}x${height} ${format} file: ${outFile}`);
