/**
 * Regenerate high-level (lv4-6) sprites using Gemini 2.5 Flash Image model.
 *
 * Problem: lv4-6 sprites for Hunter, Rogue, Summoner, Warrior all converge to
 * generic "armored warrior" look with no class distinction.
 *
 * Solution: Use Gemini image generation with lv1 sprite as reference to produce
 * class-distinct lv4-6 sprites, then post-process (bg removal, noise removal,
 * normalization) and derive Guardian variants from Warrior.
 *
 * Usage: node scripts/regenerate-sprites.mjs
 *
 * Requires LITELLM_BASE_URL and LITELLM_API_KEY in .env.local
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const SPRITES_DIR = join(PROJECT_ROOT, 'public', 'sprites');
const TEMP_DIR = join(PROJECT_ROOT, 'scripts', '.sprite-temp');

mkdirSync(TEMP_DIR, { recursive: true });

// ── Environment ──────────────────────────────────────────────

const envContent = readFileSync(join(PROJECT_ROOT, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^(\w+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const BASE_URL = env.LITELLM_BASE_URL;
const API_KEY = env.LITELLM_API_KEY;
const MODEL = 'gemini-2.5-flash-image';

if (!BASE_URL || !API_KEY) {
  console.error('Missing LITELLM_BASE_URL or LITELLM_API_KEY in .env.local');
  process.exit(1);
}

// ── Post-processing (from crop-sprites.mjs) ──────────────────

const DARK_BG_THRESHOLD = 23;
const LIGHT_BG_THRESHOLD = 200;
const MIN_ISLAND_SIZE = 150;
const CANVAS = 384;
const TARGET_MAX = 320;

/**
 * Flood-fill from edges to remove background pixels (dark OR light).
 * Gemini sometimes generates dark backgrounds, sometimes white/light gray.
 */
function removeBackground(data, width, height, channels) {
  const isBgPixel = (idx) => {
    const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
    if (a === 0) return true;
    const isDark = r < DARK_BG_THRESHOLD && g < DARK_BG_THRESHOLD && b < DARK_BG_THRESHOLD;
    const isLight = r > LIGHT_BG_THRESHOLD && g > LIGHT_BG_THRESHOLD && b > LIGHT_BG_THRESHOLD;
    return isDark || isLight;
  };

  const visited = new Uint8Array(width * height);
  const queue = [];

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
    if (!isBgPixel(idx)) continue;

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

function removeSmallIslands(data, width, height, channels, minSize) {
  const totalPixels = width * height;
  const labels = new Int32Array(totalPixels);
  let nextLabel = 1;

  for (let start = 0; start < totalPixels; start++) {
    const startIdx = start * channels;
    if (data[startIdx + 3] === 0 || labels[start] !== 0) continue;

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

async function postProcess(inputPath, outputPath) {
  // Step 1: Read raw pixels
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Step 2: Background removal (flood-fill from edges)
  removeBackground(data, info.width, info.height, info.channels);

  // Step 3: Noise removal (small island cleanup)
  removeSmallIslands(data, info.width, info.height, info.channels, MIN_ISLAND_SIZE);

  // Step 4: Rebuild image from cleaned pixels
  const cleanedBuf = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels }
  }).png().toBuffer();

  // Step 5: Normalize — find bbox, resize to TARGET_MAX, center in CANVAS
  const { data: cleanData, info: cleanInfo } = await sharp(cleanedBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bbox = findBoundingBox(cleanData, cleanInfo.width, cleanInfo.height, cleanInfo.channels);
  if (!bbox) {
    console.log(`    WARN: fully transparent after cleanup, saving as-is`);
    writeFileSync(outputPath, cleanedBuf);
    return;
  }

  const resized = await sharp(cleanedBuf)
    .extract(bbox)
    .resize(TARGET_MAX, TARGET_MAX, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const resizedMeta = await sharp(resized).metadata();
  const rw = resizedMeta.width;
  const rh = resizedMeta.height;

  const padTop = Math.floor((CANVAS - rh) / 2);
  const padBottom = CANVAS - rh - padTop;
  const padLeft = Math.floor((CANVAS - rw) / 2);
  const padRight = CANVAS - rw - padLeft;

  await sharp(resized)
    .extend({
      top: padTop,
      bottom: padBottom,
      left: padLeft,
      right: padRight,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);
}

// ── Gemini API ───────────────────────────────────────────────

async function callGemini(referenceImagePath, prompt, retries = 2) {
  const spriteBuffer = readFileSync(referenceImagePath);
  const spriteB64 = spriteBuffer.toString('base64');

  const body = {
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${spriteB64}` }
          }
        ]
      }
    ],
    max_tokens: 4096
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`    Retry ${attempt}/${retries}...`);
      await sleep(3000);
    }

    try {
      const resp = await fetch(`${BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await resp.json();

      if (data.error) {
        console.error(`    API error: ${JSON.stringify(data.error).slice(0, 200)}`);
        continue;
      }

      const msg = data.choices?.[0]?.message;
      if (!msg) {
        console.error(`    No message in response`);
        continue;
      }

      // Check msg.images (LiteLLM/Gemini format)
      if (Array.isArray(msg.images) && msg.images.length > 0) {
        const url = msg.images[0].image_url?.url || '';
        const b64 = url.replace(/^data:image\/\w+;base64,/, '');
        if (b64.length > 100) {
          return Buffer.from(b64, 'base64');
        }
      }

      // Check array content (multimodal response)
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'image_url') {
            const url = part.image_url?.url || '';
            const b64 = url.replace(/^data:image\/\w+;base64,/, '');
            if (b64.length > 100) {
              return Buffer.from(b64, 'base64');
            }
          }
        }
      }

      // Check string content with embedded base64
      if (typeof msg.content === 'string') {
        const imgMatch = msg.content.match(/data:image\/\w+;base64,([A-Za-z0-9+/=]+)/);
        if (imgMatch && imgMatch[1].length > 100) {
          return Buffer.from(imgMatch[1], 'base64');
        }
      }

      console.error(`    No image found in response`);
    } catch (err) {
      console.error(`    Request failed: ${err.message}`);
    }
  }

  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Prompts ──────────────────────────────────────────────────

const COMMON_PREFIX = `You are generating a pixel art RPG character sprite.
Style: 16-32bit pixel art, single character, transparent background, no text/labels.
Standing pose, facing forward or slightly angled. ~384x384 pixels.
I'm providing the Level 1 (beginner) version as reference for class identity.
Generate the upgraded version described below. Only output the image.`;

const PROMPTS = {
  hunter: {
    lv4: `${COMMON_PREFIX}

Class: HUNTER / Ranger (green theme, bow, nature)
Level: Veteran ranger
- Green leather armor with leaf motifs and vine trim
- Enchanted longbow with glowing green arrows in quiver
- Forest cape with hood down, leaf clasps
- Lean archer build, NOT bulky plate armor
- Earthy brown boots, leather bracers with nature runes`,

    lv5: `${COMMON_PREFIX}

Class: HUNTER / Elite Forest Guardian (green theme, bow, nature)
Level: Elite tier
- Living wood scale armor that looks grown not forged
- Nature-energy bow that pulses with emerald light
- Vine bracers, antler crown/headpiece
- Floating leaf particles around character
- Lean muscular archer build — absolutely NOT a plate-armored warrior
- Deep forest green palette with golden accents`,

    lv6: `${COMMON_PREFIX}

Class: HUNTER / Legendary Nature Warden (green theme, bow, nature)
Level: LEGENDARY — maximum power
- Treant-bark armor fused with living wood, moss details
- Spirit bow radiating intense green energy aura
- Floating leaves and nature spirits orbiting the character
- Green-glowing eyes, antler crown with energy
- Lean archer silhouette — must be visually distinct from warrior/knight
- Rich emerald, forest green, gold color palette`
  },

  rogue: {
    lv4: `${COMMON_PREFIX}

Class: ROGUE / Master Assassin (dark/crimson theme, daggers, stealth)
Level: Master assassin
- Dark leather armor with crimson accent stitching
- Dual curved daggers, one in each hand
- Hood and mask covering lower face
- Belt of potion vials and throwing knives
- Lean, agile build — NOT bulky armor
- Dark gray/black with blood-red highlights`,

    lv5: `${COMMON_PREFIX}

Class: ROGUE / Shadow Lord (dark/crimson theme, daggers, stealth)
Level: Shadow lord tier
- Jet-black leather armor with blood-red glowing runes
- Twin shadow daggers trailing dark smoke
- Cloak that dissolves into smoke at the edges
- Hidden face behind dark hood, only red eyes visible
- Lean assassin build, absolutely NOT plate armor
- Black, dark crimson, smoky purple palette`,

    lv6: `${COMMON_PREFIX}

Class: ROGUE / Legendary Phantom Blade (dark/crimson theme, daggers, stealth)
Level: LEGENDARY — maximum power
- Spectral dark armor that phases between solid and shadow
- Cursed crimson daggers with dark energy wisps
- Smoke/shadow aura swirling around entire body
- Red-glowing eyes, face hidden in supernatural darkness
- Lean phantom silhouette — must NOT look like armored warrior
- Dark black, deep crimson, spectral purple palette`
  },

  summoner: {
    lv4: `${COMMON_PREFIX}

Class: SUMMONER / Arcane Channeler (purple/cyan theme, staff, magic)
Level: Arcane channeler
- Blue-purple robes over light chain mail
- Crystal-topped staff with 2 floating spirit orbs
- 2 small spirit wisps orbiting the character
- Mage silhouette with flowing robes — NOT plate armor
- Glowing arcane symbols on robe edges
- Purple, blue, cyan color palette`,

    lv5: `${COMMON_PREFIX}

Class: SUMMONER / Dimensional Caller (purple/cyan theme, staff, magic)
Level: Dimensional caller tier
- Purple-cyan robes with constellation/star patterns
- Staff topped with swirling portal sphere
- 3-4 elemental orbs floating in orbit around character
- Ethereal cape that shimmers with dimensional energy
- Mage build with robes — absolutely NOT an armored warrior
- Deep purple, cyan, starlight white palette`,

    lv6: `${COMMON_PREFIX}

Class: SUMMONER / Legendary Void Archon (purple/cyan theme, staff, magic)
Level: LEGENDARY — maximum power
- Dark purple robes with cyan dimensional rift patterns
- Massive staff with portal vortex at the top
- Floating crystal shards and energy orbs orbiting
- Glowing cyan eyes, arcane energy crown
- Must look like powerful mage/summoner, NOT warrior
- Dark purple, intense cyan, void black palette`
  },

  warrior: {
    lv4: `${COMMON_PREFIX}

Class: WARRIOR / Veteran Knight (steel gray theme, sword+shield, heavy armor)
Level: Veteran knight
- Full steel plate armor, polished and battle-worn
- Kite shield with heraldic crest
- Bastard sword held at side
- Red cape flowing behind
- Visored helmet with plume
- Steel gray, silver, red accent palette`,

    lv5: `${COMMON_PREFIX}

Class: WARRIOR / War Commander (steel/dark theme, greatsword, heavy armor)
Level: War commander tier
- Ornate dark steel armor with red accent trim
- Massive greatsword, two-handed grip
- Spiked pauldrons and heavy gauntlets
- Horned helmet with red war cape
- Heavy imposing build, radiating power
- Dark steel, gunmetal, crimson accent palette`,

    lv6: `${COMMON_PREFIX}

Class: WARRIOR / Legendary Warlord (dark steel theme, flaming sword, supreme armor)
Level: LEGENDARY — maximum power
- Enchanted dark steel armor with glowing fire runes
- Colossal flaming greatsword with fire energy
- Demonic horned crown/helmet
- Fire aura around the character
- Massive imposing presence
- Dark steel, fire orange, ember red palette`
  }
};

// ── Main ─────────────────────────────────────────────────────

const CLASSES = ['hunter', 'rogue', 'summoner', 'warrior'];
const LEVELS = ['lv4', 'lv5', 'lv6'];

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Sprite Regeneration — Gemini 2.5 Flash Image     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`  Model: ${MODEL}`);
  console.log(`  Endpoint: ${BASE_URL}`);
  console.log(`  Target: ${CLASSES.length} classes × ${LEVELS.length} levels = ${CLASSES.length * LEVELS.length} sprites\n`);

  let generated = 0;
  let failed = 0;

  for (const cls of CLASSES) {
    const refPath = join(SPRITES_DIR, `${cls}_lv1.png`);
    console.log(`\n── ${cls.toUpperCase()} (ref: ${cls}_lv1.png) ──`);

    for (const lv of LEVELS) {
      const outName = `${cls}_${lv}.png`;
      const tempPath = join(TEMP_DIR, outName);
      const finalPath = join(SPRITES_DIR, outName);

      console.log(`  ${outName}:`);
      console.log(`    Generating...`);

      const imgBuffer = await callGemini(refPath, PROMPTS[cls][lv]);

      if (!imgBuffer) {
        console.log(`    FAILED — skipping`);
        failed++;
        continue;
      }

      // Save raw generated image to temp
      const rawPath = join(TEMP_DIR, `${cls}_${lv}_raw.png`);
      writeFileSync(rawPath, imgBuffer);
      console.log(`    Raw: ${Math.round(imgBuffer.length / 1024)}KB`);

      // Post-process: bg removal + noise removal + normalization
      console.log(`    Post-processing...`);
      try {
        await postProcess(rawPath, finalPath);
        console.log(`    -> ${outName}`);
        generated++;
      } catch (err) {
        console.error(`    Post-process error: ${err.message}`);
        // Fall back: just copy raw image resized
        try {
          await sharp(rawPath)
            .resize(CANVAS, CANVAS, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(finalPath);
          console.log(`    -> ${outName} (resize only, no cleanup)`);
          generated++;
        } catch (err2) {
          console.error(`    Resize fallback also failed: ${err2.message}`);
          failed++;
        }
      }

      // 2s delay between API calls
      await sleep(2000);
    }
  }

  // ── Guardian derivation from Warrior ──
  console.log('\n── GUARDIAN (derived from Warrior) ──');
  for (const lv of LEVELS) {
    const warriorPath = join(SPRITES_DIR, `warrior_${lv}.png`);
    const guardianPath = join(SPRITES_DIR, `guardian_${lv}.png`);

    try {
      await sharp(warriorPath)
        .flop()
        .tint({ r: 255, g: 200, b: 50 })
        .modulate({ brightness: 1.4, saturation: 2.0 })
        .png()
        .toFile(guardianPath);
      console.log(`  guardian_${lv}.png (flipped + gold tint)`);
    } catch (err) {
      console.error(`  guardian_${lv}.png FAILED: ${err.message}`);
    }
  }

  console.log(`\n════════════════════════════════════════════════════`);
  console.log(`  Generated: ${generated}/${CLASSES.length * LEVELS.length}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Guardian derived: 3`);
  console.log(`  Total sprites updated: ${generated + 3}`);
  console.log(`════════════════════════════════════════════════════\n`);

  if (failed > 0) {
    console.log('Some sprites failed. Re-run the script or check the API.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
