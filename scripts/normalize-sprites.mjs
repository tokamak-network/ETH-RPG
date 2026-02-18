/**
 * Normalize tiered sprites so all characters have a consistent visual size.
 *
 * Problem: crop-sprites.mjs produces 384x384 PNGs where the character
 * bounding box varies from 33% to 93% of the canvas. This makes different
 * classes/tiers look wildly different in size on-screen.
 *
 * Solution: for each _lv*.png, find the character bounding box, extract it,
 * resize to fit within a consistent target area, and center in 384x384.
 *
 * Target: max character height/width = 320px (matching original sprites),
 * centered in 384x384 canvas with transparent padding.
 */

import sharp from 'sharp';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = join(__dirname, '..', 'public', 'sprites');

const CANVAS = 384;
const TARGET_MAX = 320; // max character dimension (matches original sprites)

/**
 * Find the bounding box of non-transparent pixels.
 * Returns { left, top, width, height } or null if fully transparent.
 */
function findBoundingBox(data, width, height, channels) {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function normalizeSprite(filePath, fileName) {
  // Read and get raw pixels
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bbox = findBoundingBox(data, info.width, info.height, info.channels);
  if (!bbox) {
    console.log(`  SKIP ${fileName} (fully transparent)`);
    return;
  }

  const oldFill = ((bbox.width * bbox.height) / (info.width * info.height) * 100).toFixed(1);

  // Extract character region, resize to fit TARGET_MAX, center in CANVAS
  const normalized = await sharp(filePath)
    .extract(bbox)
    .resize(TARGET_MAX, TARGET_MAX, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      // Will be recalculated after resize to center in CANVAS
      top: 0, bottom: 0, left: 0, right: 0,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  // Get actual size after resize
  const resizedMeta = await sharp(normalized).metadata();
  const rw = resizedMeta.width;
  const rh = resizedMeta.height;

  // Calculate padding to center in CANVAS x CANVAS
  const padTop = Math.floor((CANVAS - rh) / 2);
  const padBottom = CANVAS - rh - padTop;
  const padLeft = Math.floor((CANVAS - rw) / 2);
  const padRight = CANVAS - rw - padLeft;

  await sharp(normalized)
    .extend({
      top: padTop,
      bottom: padBottom,
      left: padLeft,
      right: padRight,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(filePath + '.tmp');

  // Atomic rename
  const fs = await import('fs/promises');
  await fs.rename(filePath + '.tmp', filePath);

  const newFill = ((rw * rh) / (CANVAS * CANVAS) * 100).toFixed(1);
  console.log(`  ${fileName.padEnd(28)} ${bbox.width}x${bbox.height} (${oldFill}%) -> ${rw}x${rh} centered (${newFill}%)`);
}

async function main() {
  const files = readdirSync(SPRITES_DIR)
    .filter(f => f.match(/_lv\d\.png$/))
    .sort();

  console.log(`Normalizing ${files.length} tiered sprites to ${TARGET_MAX}px max, centered in ${CANVAS}x${CANVAS}...\n`);

  for (const file of files) {
    await normalizeSprite(join(SPRITES_DIR, file), file);
  }

  console.log(`\nDone! ${files.length} sprites normalized.`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
