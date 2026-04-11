#!/usr/bin/env node
import { program, Option } from "commander";
import fs from "fs";
import { GML } from "gmljs";
import { Preview } from "../preview.ts";
import packageJson from "../../package.json" with { type: "json" };

program
  .description("Render GML file to image")
  .argument("<input>", "gml file input")
  .argument("[output]", "image file output")
  .option("-w, --width <n>", "output width", parseInt, 1024)
  .option("-h, --height <n>", "output height", parseInt, 768)
  // .option("-b, --background <hexcolor>", "background color", "white")
  .addOption(
    new Option("-f, --format <format>", "output format").choices(["png", "jpg"]).default("png"),
  )
  .version(packageJson.version)
  .parse(process.argv);

const options = program.opts();
const file = fs.readFileSync(options.input, "utf8");
const preview = new Preview(new GML(file), options);
const image = preview.getPreview(options.format);

fs.writeFileSync(options.output, image.replace(/^data:image\/[a-z]+;base64,/, ""), "base64");
