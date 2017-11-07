import commander from 'commander';
import fs from 'fs';
import GMLPreview from '../preview';
import packageJson from '../../package.json';

function main() {
  commander
    .version(packageJson.version)
    .option('-i, --input <input>', 'GML file input')
    .option('-o, --output <output>', 'image file output')
    .option('-w, --width <n>', 'output width', parseInt)
    .option('-h, --height <n>', 'output height', parseInt)
    .option('-b, --bg <hexcolor>', 'background color')
    .option('-f, --format <format>', 'output format', /^(jpeg|png)$/i, 'png')
    .parse(process.argv);
  if (!commander.input) {
    console.error('Input file missing.'); // eslint-disable-line no-console
    commander.help();
  }
  if (!commander.output) {
    console.error('Output file missing.'); // eslint-disable-line no-console
    commander.help();
  }
  if (!commander.width || !commander.height) {
    console.error('Width or height missing.'); // eslint-disable-line no-console
    commander.help();
  }
  fs.readFile(commander.input, 'utf8', (err, data) => {
    if (err) {
      throw err;
    }
    const preview = new GMLPreview(data, commander.width, commander.height);
    if (commander.bg) {
      preview.setBackgroundColor(commander.bg);
    }
    const imageData = preview.getPreview(`image/${commander.format}`).replace(/^data:image\/png;base64,/, '');
    fs.writeFile(commander.output, imageData, 'base64', (err) => {
      if (err) {
        throw err;
      }
    });
  });
}

export default { run: main };