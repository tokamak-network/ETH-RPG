/**
 * Remove dark backgrounds from tiered sprites using edge flood-fill.
 * Processes all *_lv*.png files in public/sprites/ in-place.
 */

import sharp from 'sharp';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = join(__dirname, '..', 'public', 'sprites');

/** Threshold: pixels with r,g,b all below this are considered "dark background".
 *  Set conservatively low — original sprites show darkest character pixels
 *  have max(r,g,b) >= 30, so 18 is safe. */
const BG_THRESHOLD = 18;

/**
 * Flood-fill from edges to remove dark background, making it transparent.
 * Only removes connected dark pixels reachable from the image border.
 */
function removeBackground(data, width, height, channels) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const isDark = (idx) => {
    const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
    return a > 0 && r < BG_THRESHOLD && g < BG_THRESHOLD && b < BG_THRESHOLD;
  };

  // Seed from all 4 edges
  for (let x = 0; x < width; x++) {
    queue.push(x);
    queue.push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width);
    queue.push(y * width + (width - 1));
  }

  while (queue.length > 0) {
    const pos = queue.pop();
    if (pos < 0 || pos >= width * height) continue;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * channels;
    // Stop at non-dark opaque pixels (character pixels) and already-transparent pixels
    if (!isDark(idx) && data[idx + 3] !== 0) continue;

    // Make transparent
    data[idx] = 0;
    data[idx + 1] = 0;
    data[idx + 2] = 0;
    data[idx + 3] = 0;

    const x = pos % width;
    const y = Math.floor(pos / width);
    if (x > 0) queue.push(pos - 1);
    if (x < width - 1) queue.push(pos + 1);
    if (y > 0) queue.push(pos - width);
    if (y < height - 1) queue.push(pos + width);
  }
}

async function processFile(filePath, fileName) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  removeBackground(data, info.width, info.height, info.channels);

  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toFile(filePath + '.tmp');

  // Rename tmp to final (atomic-ish overwrite)
  const fs = await import('fs/promises');
  await fs.rename(filePath + '.tmp', filePath);

  console.log(`  ✓ ${fileName}`);
}

async function main() {
  const files = readdirSync(SPRITES_DIR)
    .filter(f => f.match(/_lv\d\.png$/))
    .sort();

  console.log(`Removing backgrounds from ${files.length} tiered sprites...\n`);

  for (const file of files) {
    await processFile(join(SPRITES_DIR, file), file);
  }

  console.log(`\nDone! ${files.length} sprites processed.`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
