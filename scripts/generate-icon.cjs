const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const pngToIcoModule = require("png-to-ico");
const pngToIco = pngToIcoModule.default ?? pngToIcoModule;

const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "build", "icon.svg");
const pngPath = path.join(root, "build", "icon.png");
const icoPath = path.join(root, "build", "icon.ico");

async function main() {
  const svg = await fs.readFile(svgPath);
  await sharp(svg).resize(1024, 1024).png().toFile(pngPath);

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
  );
  const ico = await pngToIco(pngBuffers);
  await fs.writeFile(icoPath, ico);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
