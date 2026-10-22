const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const directory = path.join(__dirname, "..", "assets", "brand");
fs.mkdirSync(directory, { recursive: true });
const paths = (color) =>
  `<path d="M32 5 53 13v17c0 13-9 23-21 29C20 53 11 43 11 30V13L32 5Z" stroke="${color}" stroke-width="3.5" stroke-linejoin="round"/><path d="M40 22H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14" stroke="${color}" stroke-width="4" stroke-linecap="round"/><path d="m28 37-6 6v-9M35 22l7-6" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
const svg = (color, bg, scale = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 64 64" fill="none">${bg ? `<rect width="64" height="64" fill="${bg}"/>` : ""}<g transform="translate(${32 * (1 - scale)},${32 * (1 - scale)}) scale(${scale})">${paths(color)}</g></svg>`;
fs.writeFileSync(path.join(directory, "mark.svg"), svg("#0064EF", null));
fs.writeFileSync(
  path.join(directory, "app-icon.svg"),
  svg("#FFFFFF", "#0064EF", 0.65),
);
(async () => {
  await sharp(Buffer.from(svg("#FFFFFF", "#0064EF", 0.65)))
    .png()
    .toFile(path.join(directory, "icon.png"));
  await sharp(Buffer.from(svg("#FFFFFF", null, 0.57)))
    .png()
    .toFile(path.join(directory, "adaptive-foreground.png"));
  await sharp(Buffer.from(svg("#FFFFFF", null, 0.57)))
    .png()
    .toFile(path.join(directory, "monochrome.png"));
  await sharp(Buffer.from(svg("#0064EF", null, 0.85)))
    .resize(400)
    .png()
    .toFile(path.join(directory, "splash-mark.png"));
  await sharp(Buffer.from(svg("#FFFFFF", "#0064EF", 0.7)))
    .resize(64)
    .png()
    .toFile(path.join(directory, "favicon.png"));
  console.log("Original vector mark and native icon/splash assets generated.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
