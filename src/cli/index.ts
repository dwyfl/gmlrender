import { program, Option } from "commander";
import fs from "fs";
import { GML } from "gmljs";
import { Preview } from "../preview";
import packageJson from "../../package.json";

function main() {
  program
    .description("Render GML file to image")
    .argument("<input>", "gml file input")
    .argument("[output]", "image file output")
    .option("-w, --width <n>", "output width", parseInt, 1024)
    .option("-h, --height <n>", "output height", parseInt, 768)
    .option("-b, --background <hexcolor>", "background color", "white")
    .addOption(
      new Option("-f, --format <format>", "output format")
        .choices(["png", "jpg"])
        .default("png")
    )
    .version(packageJson.version)
    .parse(process.argv);

  const options = program.opts();
  const data = fs.readFileSync(options.input, "utf8");
  const preview = new Preview(new GML(data), options.width, options.height);

  if (options.background) {
    preview.setBackgroundColor(options.background);
  }

  const imageData = preview
    .getPreview(`image/${options.format}`)
    .replace(/^data:image\/png;base64,/, "");

  fs.writeFileSync(options.output, imageData, "base64");
}

export default { run: main };
