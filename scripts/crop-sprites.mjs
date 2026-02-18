/**
 * Sprite cropping script for level-based evolution system.
 * Crops 48 individual sprites (8 classes × 6 tiers) from 7 Gemini-generated source sheets.
 *
 * Coordinates determined by automated pixel-boundary analysis.
 * Output: public/sprites/{classId}_lv{1-6}.png (384×384, transparent bg)
 */

import sharp from 'sharp';
import { mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DOWNLOADS = join(process.env.HOME, 'Downloads');
const OUT_DIR = join(PROJECT_ROOT, 'public', 'sprites');
const SIZE = 384;

mkdirSync(OUT_DIR, { recursive: true });

const SRC = {
  cagimz: join(DOWNLOADS, 'Gemini_Generated_Image_cagimzcagimzcagi.png'),
  '58mvdv': join(DOWNLOADS, 'Gemini_Generated_Image_58mvdv58mvdv58mv.png'),
  tnv8vl: join(DOWNLOADS, 'Gemini_Generated_Image_tnv8vltnv8vltnv8.png'),
  nll09m: join(DOWNLOADS, 'Gemini_Generated_Image_nll09mnll09mnll0.png'),
  s0dokz: join(DOWNLOADS, 'Gemini_Generated_Image_s0dokzs0dokzs0do.png'),
  q62znt: join(DOWNLOADS, 'Gemini_Generated_Image_q62zntq62zntq62z.png'),
  ytfgnw: join(DOWNLOADS, 'Gemini_Generated_Image_ytfgnwytfgnwytfg.png'),
};

/** Threshold for considering a pixel "dark enough" to be background.
 *  Set conservatively low — original sprites show darkest character pixels
 *  have max(r,g,b) >= 30, so 18 is safe to avoid eating into characters. */
const BG_THRESHOLD = 23;

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
    queue.push(x);                          // top edge
    queue.push((height - 1) * width + x);   // bottom edge
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width);                  // left edge
    queue.push(y * width + (width - 1));    // right edge
  }

  while (queue.length > 0) {
    const pos = queue.pop();
    if (pos < 0 || pos >= width * height) continue;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * channels;
    if (!isDark(idx) && data[idx + 3] !== 0) continue; // stop at non-dark opaque pixels

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

/**
 * Remove small isolated opaque pixel clusters (noise/speckles).
 * Uses connected-component labeling; any island smaller than minSize is made transparent.
 */
function removeSmallIslands(data, width, height, channels, minSize) {
  const totalPixels = width * height;
  const labels = new Int32Array(totalPixels); // 0 = unvisited
  let nextLabel = 1;

  for (let start = 0; start < totalPixels; start++) {
    const startIdx = start * channels;
    if (data[startIdx + 3] === 0 || labels[start] !== 0) continue;

    // BFS to find connected opaque island
    const label = nextLabel++;
    const island = [];
    const q = [start];
    labels[start] = label;

    while (q.length > 0) {
      const pos = q.pop();
      island.push(pos);
      const x = pos % width;
      const y = Math.floor(pos / width);
      const neighbors = [];
      if (x > 0) neighbors.push(pos - 1);
      if (x < width - 1) neighbors.push(pos + 1);
      if (y > 0) neighbors.push(pos - width);
      if (y < height - 1) neighbors.push(pos + width);
      for (const n of neighbors) {
        if (labels[n] === 0 && data[n * channels + 3] > 0) {
          labels[n] = label;
          q.push(n);
        }
      }
    }

    // Remove island if too small
    if (island.length < minSize) {
      for (const pos of island) {
        const idx = pos * channels;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      }
    }
  }
}

async function cropAndSave(srcPath, region, outName) {
  const outPath = join(OUT_DIR, outName);
  // Step 1: Crop and resize to PNG buffer
  const pngBuf = await sharp(srcPath)
    .extract(region)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();

  // Step 2: Get raw pixels from PNG buffer
  const { data, info } = await sharp(pngBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Step 3: Flood-fill background removal from edges
  removeBackground(data, info.width, info.height, info.channels);

  // Step 4: Remove small isolated opaque clusters (background noise speckles).
  // Any connected group of opaque pixels smaller than MIN_ISLAND_SIZE is removed.
  removeSmallIslands(data, info.width, info.height, info.channels, 150);

  // Step 5: Write final PNG
  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toFile(outPath);

  console.log(`  ✓ ${outName}`);
}

async function tintAndSave(warriorFile, outName) {
  const outPath = join(OUT_DIR, outName);
  await sharp(warriorFile)
    .tint({ r: 249, g: 115, b: 22 })
    .png()
    .toFile(outPath);
  console.log(`  ✓ ${outName} (tinted)`);
}

// ──────────────────────────────────────────────────────────
// Coordinates from pixel-boundary analysis.
// Format: { left, top, width, height } for sharp.extract()
// ──────────────────────────────────────────────────────────

// Priest (cagimz, 2048×2048) — first sprite (S0) in each of 5 rows.
// Rows: LVL1, LVL2, LVL4, LVL5, LVL6. LVL3 = copy of LVL2.
// Labels extend to ~x165, actual sprites start ~x174+.
// Row0: y49-377, S0: x184-385
// Row1: y431-780, S0: x186-385
// Row2: y798-1193, sprite at x174-422 (skip label at x143-165)
// Row3: y1238-1589, sprite at x174-416
// Row4: y1639-1990, S0: x189-408
const PRIEST_CROPS = {
  lv1: { left: 184, top: 49, width: 201, height: 328 },
  lv2: { left: 186, top: 431, width: 199, height: 349 },
  lv4: { left: 174, top: 798, width: 248, height: 395 },
  lv5: { left: 174, top: 1238, width: 242, height: 351 },
  lv6: { left: 189, top: 1639, width: 219, height: 351 },
};

// Warrior (58mvdv, 2048×2048) — right-side sprites.
// Row0: y48-383, S4: x1364-1608 (w=244)
// Row1: y432-785, S4: x1361-1615 (w=254)
// Row2: y803-1194, S4: x1357-1645 (w=288)
// Row3: y1237-1597, S4: x1355-1641 (w=286)
// Row4: y1617-1997, continuous — need to isolate first warrior
// For Row4 (LVL6), the sprites merge. Use the leftmost segment ~x1350-1700.
const WARRIOR_CROPS = {
  lv1: { left: 1364, top: 48, width: 244, height: 335 },
  lv2: { left: 1361, top: 432, width: 254, height: 353 },
  lv4: { left: 1357, top: 803, width: 288, height: 391 },
  lv5: { left: 1355, top: 1237, width: 286, height: 360 },
  lv6: { left: 1350, top: 1617, width: 350, height: 380 },
};

// Elder Wizard (tnv8vl, 2048×2048) — right-side sprites.
// Row0: y48-382, S4: x1389-1596 (w=207)
// Row1: y409-779, S4: x1365-1613 (w=248)
// Row2: y798-1194, S4: x1352-1983 (w=631) — merged, take first ~350px
// Row3: y1206-1592, S4: x1353-1986 (w=633) — merged, take first ~350px
// Row4: y1611-1992, S3: x1024-1986 (w=962) — very merged, take ~x1350-1700
const ELDER_WIZARD_CROPS = {
  lv1: { left: 1389, top: 48, width: 207, height: 334 },
  lv2: { left: 1365, top: 409, width: 248, height: 370 },
  lv4: { left: 1352, top: 798, width: 330, height: 396 },
  lv5: { left: 1353, top: 1206, width: 330, height: 386 },
  lv6: { left: 1350, top: 1611, width: 350, height: 381 },
};

// Merchant (nll09m, 2816×1536) — first actual sprite per row (S0 in analysis, after labels).
// Row0: y28-242, S0(first real): x276-426 (w=150)
// Row1: y278-495, S0: x250-434 (w=184)
// Row2: y509-753, S0: x217-436 (w=219)
// Row3: y774-1006, S0: x255-439 (w=184) — but S1 at x473 is more detailed. Use S0.
// Row4: y1018-1264, S0: x201-946 (w=745) — merged. Take ~x250-500.
// Row5: y1266-1522, S0: x200-449 (w=249)
const MERCHANT_CROPS = {
  lv1: { left: 276, top: 28, width: 150, height: 214 },
  lv2: { left: 250, top: 278, width: 184, height: 217 },
  lv3: { left: 217, top: 509, width: 219, height: 244 },
  lv4: { left: 255, top: 774, width: 184, height: 232 },
  lv5: { left: 250, top: 1018, width: 300, height: 246 },
  lv6: { left: 200, top: 1266, width: 249, height: 256 },
};

// Summoner (s0dokz, 2816×1536)
// Row0: y28-242, S0: x276-435 (w=159)
// Row1: y271-495, S0: x251-443 (w=192)
// Row2: y525-749, S0: x247-441 (w=194)
// Row3: y762-1005, S0: x249-472 (w=223)
// Row4: y1016-1262, S0: x244-451 (w=207)
// Row5: y1265-1522, S0: x246-1869 (w=1623) — merged. Take ~x246-520.
const SUMMONER_CROPS = {
  lv1: { left: 276, top: 28, width: 159, height: 214 },
  lv2: { left: 251, top: 271, width: 192, height: 224 },
  lv3: { left: 247, top: 525, width: 194, height: 224 },
  lv4: { left: 249, top: 762, width: 223, height: 243 },
  lv5: { left: 244, top: 1016, width: 207, height: 246 },
  lv6: { left: 246, top: 1265, width: 200, height: 257 },
};

// Rogue (q62znt, 2816×1536) — rows span across label+sprite zones.
// LVL1 sprites: y=26-200, first at x279-424 (w=145)
// LVL2: y274-490, first at x282-430
// LVL3: y529-703, first at x279-433
// LVL4: y785-999, first at x276-437
// LVL5: y1020-1258, first at x266-460
// LVL6: y1269-1516, first at x251-451
const ROGUE_CROPS = {
  lv1: { left: 279, top: 26, width: 145, height: 174 },
  lv2: { left: 282, top: 274, width: 148, height: 216 },
  lv3: { left: 279, top: 529, width: 154, height: 174 },
  lv4: { left: 276, top: 785, width: 161, height: 214 },
  lv5: { left: 266, top: 1020, width: 194, height: 238 },
  lv6: { left: 251, top: 1269, width: 200, height: 247 },
};

// Hunter (ytfgnw, 2816×1536) — 5 rows detected, rows 5+6 combined.
// Row0: y25-241 (h=216) — LVL 1, S0: x265-426 (w=161)
// Row1: y272-489 (h=217) — LVL 2, S0: x263-422 (w=159)
// Row2: y526-744 (h=218) — LVL 3, S0: x266-451 (w=185)
// Row3: y782-999 (h=217) — LVL 4, S0: x258-423 (w=165)
// Row4: y1010-1526 (h=516) — LVL 5+6 combined
//   Need to split: LVL5 ~y1010-1260, LVL6 ~y1270-1526
//   LVL5: S0: x241-469 (w=228) — first part of row
//   LVL6: second part — need to detect split point
// For now, split evenly: LVL5 y1010-1260, LVL6 y1270-1526
const HUNTER_CROPS = {
  lv1: { left: 265, top: 25, width: 161, height: 216 },
  lv2: { left: 263, top: 272, width: 159, height: 217 },
  lv3: { left: 266, top: 526, width: 185, height: 218 },
  lv4: { left: 258, top: 782, width: 165, height: 217 },
  lv5: { left: 241, top: 1010, width: 228, height: 250 },
  lv6: { left: 241, top: 1270, width: 210, height: 256 },
};

async function main() {
  console.log('Cropping sprites for level-based evolution system...\n');

  // --- Priest ---
  console.log('Priest (cagimz):');
  for (const [lvKey, region] of Object.entries(PRIEST_CROPS)) {
    await cropAndSave(SRC.cagimz, region, `priest_${lvKey}.png`);
  }
  copyFileSync(join(OUT_DIR, 'priest_lv2.png'), join(OUT_DIR, 'priest_lv3.png'));
  console.log('  = priest_lv3.png (copied from lv2)');

  // --- Warrior ---
  console.log('\nWarrior (58mvdv):');
  for (const [lvKey, region] of Object.entries(WARRIOR_CROPS)) {
    await cropAndSave(SRC['58mvdv'], region, `warrior_${lvKey}.png`);
  }
  copyFileSync(join(OUT_DIR, 'warrior_lv2.png'), join(OUT_DIR, 'warrior_lv3.png'));
  console.log('  = warrior_lv3.png (copied from lv2)');

  // --- Elder Wizard ---
  console.log('\nElder Wizard (tnv8vl):');
  for (const [lvKey, region] of Object.entries(ELDER_WIZARD_CROPS)) {
    await cropAndSave(SRC.tnv8vl, region, `elder_wizard_${lvKey}.png`);
  }
  copyFileSync(join(OUT_DIR, 'elder_wizard_lv2.png'), join(OUT_DIR, 'elder_wizard_lv3.png'));
  console.log('  = elder_wizard_lv3.png (copied from lv2)');

  // --- Merchant ---
  console.log('\nMerchant (nll09m):');
  for (const [lvKey, region] of Object.entries(MERCHANT_CROPS)) {
    await cropAndSave(SRC.nll09m, region, `merchant_${lvKey}.png`);
  }

  // --- Summoner ---
  console.log('\nSummoner (s0dokz):');
  for (const [lvKey, region] of Object.entries(SUMMONER_CROPS)) {
    await cropAndSave(SRC.s0dokz, region, `summoner_${lvKey}.png`);
  }

  // --- Rogue ---
  console.log('\nRogue (q62znt):');
  for (const [lvKey, region] of Object.entries(ROGUE_CROPS)) {
    await cropAndSave(SRC.q62znt, region, `rogue_${lvKey}.png`);
  }

  // --- Hunter ---
  console.log('\nHunter (ytfgnw):');
  for (const [lvKey, region] of Object.entries(HUNTER_CROPS)) {
    await cropAndSave(SRC.ytfgnw, region, `hunter_${lvKey}.png`);
  }

  // --- Guardian (tinted Warrior) ---
  console.log('\nGuardian (warrior + orange tint):');
  for (let lv = 1; lv <= 6; lv++) {
    const warriorFile = join(OUT_DIR, `warrior_lv${lv}.png`);
    await tintAndSave(warriorFile, `guardian_lv${lv}.png`);
  }

  console.log('\nDone! 48 sprites generated in public/sprites/');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
