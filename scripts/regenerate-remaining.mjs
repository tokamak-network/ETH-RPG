/**
 * Regenerate ALL remaining sprites not covered by regenerate-sprites.mjs.
 *
 * Covers:
 *  - Hunter, Rogue, Summoner, Warrior: lv1, lv2, lv3 (12 sprites)
 *  - Priest, Elder Wizard, Merchant: lv1-lv6 (18 sprites)
 *  - Guardian: lv1-lv3 derived from Warrior (3 sprites)
 *  - Base sprites: {class}.png copied from lv1 (8 sprites)
 *
 * Total: 30 Gemini API calls + 11 derived/copied
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs';
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

// ── Post-processing ──────────────────────────────────────────

const DARK_BG_THRESHOLD = 23;
const LIGHT_BG_THRESHOLD = 200;
const MIN_ISLAND_SIZE = 150;
const CANVAS = 384;
const TARGET_MAX = 320;

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
    if (data[start * channels + 3] === 0 || labels[start] !== 0) continue;
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
        data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0;
      }
    }
  }
}

function findBoundingBox(data, width, height, channels) {
  let minX = width, maxX = 0, minY = height, maxY = 0, found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 10) {
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
  const { data, info } = await sharp(inputPath)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  removeBackground(data, info.width, info.height, info.channels);
  removeSmallIslands(data, info.width, info.height, info.channels, MIN_ISLAND_SIZE);

  const cleanedBuf = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels }
  }).png().toBuffer();

  const { data: cd, info: ci } = await sharp(cleanedBuf)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const bbox = findBoundingBox(cd, ci.width, ci.height, ci.channels);
  if (!bbox) {
    writeFileSync(outputPath, cleanedBuf);
    return;
  }

  const resized = await sharp(cleanedBuf)
    .extract(bbox)
    .resize(TARGET_MAX, TARGET_MAX, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const padTop = Math.floor((CANVAS - meta.height) / 2);
  const padBottom = CANVAS - meta.height - padTop;
  const padLeft = Math.floor((CANVAS - meta.width) / 2);
  const padRight = CANVAS - meta.width - padLeft;

  await sharp(resized)
    .extend({ top: padTop, bottom: padBottom, left: padLeft, right: padRight,
      background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);
}

// ── Gemini API ───────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemini(referenceImagePath, prompt, retries = 3) {
  const spriteBuffer = readFileSync(referenceImagePath);
  const spriteB64 = spriteBuffer.toString('base64');

  const body = {
    model: MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${spriteB64}` } }
      ]
    }],
    max_tokens: 4096
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const delay = 3000 * Math.pow(2, attempt - 1); // exponential backoff
      console.log(`    Retry ${attempt}/${retries} (wait ${delay / 1000}s)...`);
      await sleep(delay);
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
        console.error(`    API error: ${JSON.stringify(data.error).slice(0, 150)}`);
        continue;
      }

      const msg = data.choices?.[0]?.message;
      if (!msg) { console.error(`    No message`); continue; }

      // LiteLLM/Gemini format
      if (Array.isArray(msg.images) && msg.images.length > 0) {
        const url = msg.images[0].image_url?.url || '';
        const b64 = url.replace(/^data:image\/\w+;base64,/, '');
        if (b64.length > 100) return Buffer.from(b64, 'base64');
      }

      // Array content
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'image_url') {
            const url = part.image_url?.url || '';
            const b64 = url.replace(/^data:image\/\w+;base64,/, '');
            if (b64.length > 100) return Buffer.from(b64, 'base64');
          }
        }
      }

      // String content with base64
      if (typeof msg.content === 'string') {
        const imgMatch = msg.content.match(/data:image\/\w+;base64,([A-Za-z0-9+/=]+)/);
        if (imgMatch && imgMatch[1].length > 100) return Buffer.from(imgMatch[1], 'base64');
      }

      console.error(`    No image in response`);
    } catch (err) {
      console.error(`    Request failed: ${err.message}`);
    }
  }

  return null;
}

// ── Prompts ──────────────────────────────────────────────────

const COMMON_PREFIX = `You are generating a pixel art RPG character sprite.
Style: 16-32bit pixel art, single character, transparent background, no text/labels.
Standing pose, facing forward or slightly angled. ~384x384 pixels.
I'm providing a reference image for visual style consistency.
Generate the character described below. Only output the image.`;

const PROMPTS = {
  // ─── Hunter lv1-3 (ref: hunter_lv4) ───
  hunter: {
    lv1: `${COMMON_PREFIX}

Class: HUNTER / Novice Ranger (green theme, bow, nature)
Level: Beginner — just starting out
- Simple green tunic and brown pants, basic leather boots
- Short wooden bow held at side, small quiver with a few arrows
- Leather cap or simple headband
- Small, youthful build — clearly a novice adventurer
- Muted green and brown color palette, no glow effects`,

    lv2: `${COMMON_PREFIX}

Class: HUNTER / Apprentice Ranger (green theme, bow, nature)
Level: Apprentice — gaining experience
- Green leather armor (light), brown leather bracers
- Wooden longbow, quiver with more arrows, some with green fletching
- Simple hooded green cloak
- Lean build with slightly more confidence than a novice
- Forest green and earth brown palette`,

    lv3: `${COMMON_PREFIX}

Class: HUNTER / Skilled Ranger (green theme, bow, nature)
Level: Intermediate — competent adventurer
- Reinforced green leather armor with some metal studs
- Composite bow, full quiver, hunting knife on belt
- Green hooded cloak with leaf clasp
- Confident archer stance, lean athletic build
- Rich forest green with some silver accent palette`,
  },

  // ─── Rogue lv1-3 (ref: rogue_lv4) ───
  rogue: {
    lv1: `${COMMON_PREFIX}

Class: ROGUE / Street Thief (dark theme, dagger, stealth)
Level: Beginner — petty thief
- Ragged dark gray/brown clothing, patched cloak
- Single small dagger, coin pouch on belt
- Simple cloth face mask, messy hair
- Small, thin build — looks like a street urchin
- Muted dark gray and brown, no glowing effects`,

    lv2: `${COMMON_PREFIX}

Class: ROGUE / Cutpurse (dark/red theme, daggers, stealth)
Level: Apprentice — skilled pickpocket
- Dark leather vest over dark shirt, leather gloves
- Pair of small daggers, belt with lockpicks
- Dark hood partially covering face
- Lean, agile build with slight smirk
- Dark gray, black with slight red accent palette`,

    lv3: `${COMMON_PREFIX}

Class: ROGUE / Assassin Initiate (dark/crimson theme, daggers, stealth)
Level: Intermediate — trained assassin
- Black leather armor, reinforced with dark metal studs
- Dual curved daggers in combat-ready stance
- Hood and partial mask, belt of small vials
- Lean, agile build, crouching slightly, ready to strike
- Black leather with crimson accent stitching palette`,
  },

  // ─── Summoner lv1-3 (ref: summoner_lv4) ───
  summoner: {
    lv1: `${COMMON_PREFIX}

Class: SUMMONER / Apprentice Mage (purple theme, staff, magic)
Level: Beginner — learning magic
- Simple purple robe, too big for the wearer
- Plain wooden staff with a small crystal on top
- Sandals, rope belt, old spellbook under arm
- Young, scholarly look — clearly a student
- Muted purple and brown palette, no glow effects`,

    lv2: `${COMMON_PREFIX}

Class: SUMMONER / Adept Mage (purple theme, staff, magic)
Level: Apprentice — growing in power
- Purple robe with simple arcane rune embroidery at hem
- Crystal-tipped staff with faint purple glow
- 1 small spirit wisp floating near shoulder
- More confident stance, holding staff properly
- Purple and blue palette with subtle magical shimmer`,

    lv3: `${COMMON_PREFIX}

Class: SUMMONER / Conjurer (purple/blue theme, staff, magic)
Level: Intermediate — capable spellcaster
- Layered purple-blue robes with visible rune patterns
- Enchanted staff with glowing orb, 1-2 floating wisps
- Arcane circle faintly visible at feet
- Mage silhouette with flowing robes, NOT armored warrior
- Purple, blue palette with magical glow accents`,
  },

  // ─── Warrior lv1-3 (ref: warrior_lv4) ───
  warrior: {
    lv1: `${COMMON_PREFIX}

Class: WARRIOR / Militia Recruit (gray theme, sword, light armor)
Level: Beginner — fresh recruit
- Simple leather armor over cloth shirt, leather boots
- Short iron sword, small round wooden shield
- No helmet, messy hair, determined expression
- Stocky but untrained build
- Dull brown leather and iron gray palette, no effects`,

    lv2: `${COMMON_PREFIX}

Class: WARRIOR / Footman (steel theme, sword+shield, medium armor)
Level: Apprentice — trained soldier
- Chain mail shirt over padded gambeson
- Iron longsword, medium metal shield
- Open-face iron helmet, leather gloves
- Solid, trained build, standing at attention
- Iron gray, steel blue, with minimal red accent palette`,

    lv3: `${COMMON_PREFIX}

Class: WARRIOR / Man-at-Arms (steel theme, sword+shield, partial plate)
Level: Intermediate — experienced fighter
- Partial plate armor (breastplate + pauldrons) over chain mail
- Bastard sword, sturdy kite shield with simple emblem
- Half-helm with nose guard, red-trimmed cloak
- Strong, battle-hardened build, confident stance
- Steel gray, silver with red trim palette`,
  },

  // ─── Priest lv1-6 (ref: priest_lv1 for lv1-3, priest_lv4 for lv4-6) ───
  priest: {
    lv1: `${COMMON_PREFIX}

Class: PRIEST / Acolyte (white/gold theme, holy, healing)
Level: Beginner — temple novice
- Simple white robe, plain wooden prayer beads
- Wooden walking staff, simple sandals
- Tonsured head or simple headwear, kind expression
- Modest, humble appearance
- White and light brown palette, no glow effects`,

    lv2: `${COMMON_PREFIX}

Class: PRIEST / Cleric (white/gold theme, holy staff, healing)
Level: Apprentice — ordained cleric
- White robe with gold trim at collar and hem
- Wooden healing staff with small golden cross
- Simple white cap/mitre, prayer beads on belt
- Calm, serene expression, gentle posture
- White and gold accent palette with warm glow`,

    lv3: `${COMMON_PREFIX}

Class: PRIEST / Temple Priest (white/gold theme, holy, healing)
Level: Intermediate — respected priest
- Ornate white vestments with gold embroidery patterns
- Golden-tipped staff with holy symbol
- White mitre hat with gold cross, holy pendant
- Dignified bearing, hands in blessing gesture
- White, cream, and gold palette with soft golden aura`,

    lv4: `${COMMON_PREFIX}

Class: PRIEST / High Priest (white/gold theme, divine power)
Level: High priest — wielder of divine light
- Elaborate white-gold vestments with intricate holy symbols
- Radiant golden scepter/staff with large glowing cross
- Ornate mitre with jewels, golden halo outline
- Holy light emanating from hands and staff
- White, gold, warm light palette with divine glow`,

    lv5: `${COMMON_PREFIX}

Class: PRIEST / Archpriest (white/gold theme, supreme healer)
Level: Archpriest — near-divine power
- Magnificent white-gold ceremonial robes with divine sigils
- Divine scepter radiating holy energy, floating holy symbols
- Grand jeweled mitre, double golden halo
- Intense aura of holy light surrounding the figure
- Pure white, brilliant gold, holy light palette`,

    lv6: `${COMMON_PREFIX}

Class: PRIEST / Legendary Divine Oracle (white/gold, transcendent)
Level: LEGENDARY — avatar of divine power
- Transcendent white-gold robes seeming to be woven from light itself
- Staff of pure divine energy, floating golden scripture pages
- Crown of divine light replacing mitre, triple halo rings
- Wings of holy light or energy behind the figure
- Blinding white, radiant gold, celestial blue accents palette`,
  },

  // ─── Elder Wizard lv1-6 ───
  elder_wizard: {
    lv1: `${COMMON_PREFIX}

Class: ELDER WIZARD / Old Sage (purple theme, staff, arcane wisdom)
Level: Beginner — aged scholar starting late
- Faded purple robe, simple rope belt
- Gnarled wooden staff with small purple crystal
- Long gray/white beard, aged face, reading glasses
- Stooped, elderly build — wise but frail
- Muted purple, brown, gray palette, no effects`,

    lv2: `${COMMON_PREFIX}

Class: ELDER WIZARD / Wizard (purple/blue theme, crystal staff, arcane)
Level: Apprentice — rediscovering ancient power
- Purple robe with star/moon embroidery
- Crystal-topped staff with faint glow
- Tall pointed wizard hat, long flowing beard
- Elderly but standing straighter with more confidence
- Purple, deep blue, silver star palette`,

    lv3: `${COMMON_PREFIX}

Class: ELDER WIZARD / High Wizard (deep purple theme, enchanted staff)
Level: Intermediate — seasoned mage
- Midnight blue-purple robes with glowing rune borders
- Enchanted staff with bright purple orb, 1-2 floating runes
- Ornate pointed hat with gem, long white beard
- Commanding presence despite age, magical energy around hands
- Deep purple, midnight blue, arcane glow palette`,

    lv4: `${COMMON_PREFIX}

Class: ELDER WIZARD / Archmage (deep blue/purple theme, arcane mastery)
Level: Archmage — immense knowledge and power
- Elaborate deep purple-blue robes with constellation patterns
- Powerful staff with large glowing orb, arcane circles at feet
- Grand wizard hat/crown, long flowing white beard
- Floating slightly, magical tomes orbiting
- Deep purple, cosmic blue, arcane gold palette`,

    lv5: `${COMMON_PREFIX}

Class: ELDER WIZARD / Grand Sorcerer (cosmic purple/blue, supreme arcane)
Level: Grand sorcerer — reality-bending power
- Cosmic robes that seem to contain a starfield within them
- Staff of immense power with reality-warping orb
- 3-4 floating ancient tomes, runic circles surrounding
- Levitating, long white beard flowing with magical energy
- Deep cosmic purple, starfield blue, golden rune palette`,

    lv6: `${COMMON_PREFIX}

Class: ELDER WIZARD / Legendary Arcane Sovereign (cosmic, transcendent)
Level: LEGENDARY — master of all arcane arts
- Robes made of condensed starlight and cosmic energy
- Reality-warping staff with miniature galaxy at top
- Crown of floating arcane symbols, beard of pure energy
- Clearly levitating, surrounded by orbiting celestial bodies
- Deep space purple, cosmic blue, stellar gold, nebula pink palette`,
  },

  // ─── Merchant lv1-6 ───
  merchant: {
    lv1: `${COMMON_PREFIX}

Class: MERCHANT / Peddler (brown/gold theme, trade, wealth)
Level: Beginner — humble peddler
- Simple brown tunic and pants, worn leather boots
- Large backpack with various goods, small coin pouch
- Straw hat, friendly smile, slightly chubby
- Modest, humble traveler appearance
- Brown, tan, warm earth tone palette, no effects`,

    lv2: `${COMMON_PREFIX}

Class: MERCHANT / Shopkeeper (brown/gold theme, scales, trade)
Level: Apprentice — established shopkeeper
- Clean merchant vest over white shirt, good leather boots
- Small balance scale in one hand, coin satchel on belt
- Beret or merchant cap, confident smile
- Slightly rotund, well-fed appearance
- Brown, cream, with gold coin accent palette`,

    lv3: `${COMMON_PREFIX}

Class: MERCHANT / Trader (gold/brown theme, wealth, commerce)
Level: Intermediate — successful trader
- Fine embroidered merchant coat, silk scarf
- Gold balance scale, large coin purse, small treasure chest at feet
- Feathered hat, jeweled ring, confident grin
- Prosperous build, radiating success
- Rich brown, gold, burgundy accent palette`,

    lv4: `${COMMON_PREFIX}

Class: MERCHANT / Wealthy Merchant (gold theme, riches, trade empire)
Level: Wealthy merchant — master of commerce
- Silk merchant robes with gold thread embroidery
- Gem-encrusted golden scale, overflowing money bags
- Jeweled turban/hat, multiple gold rings and chains
- Rotund, wealthy appearance, gold coins nearby
- Gold, rich burgundy, deep brown palette with metallic accents`,

    lv5: `${COMMON_PREFIX}

Class: MERCHANT / Trade Baron (gold/royal theme, trade empire)
Level: Trade baron — controls vast trade networks
- Opulent silk-and-velvet merchant robes with fur trim
- Floating gold coins orbiting, jeweled scepter of commerce
- Crown-like merchant hat, treasure hoard at feet
- Imposing wealthy presence, dripping with jewelry
- Rich gold, royal purple, velvet red palette`,

    lv6: `${COMMON_PREFIX}

Class: MERCHANT / Legendary Merchant King (gold/royal, supreme wealth)
Level: LEGENDARY — richest being in the realm
- Regal golden robes encrusted with every type of gemstone
- Floating golden scale of cosmic proportions, crown of pure gold
- Mountains of gold and gems surrounding the character
- Golden aura of wealth, coins raining around
- Pure gold, diamond sparkle, royal purple, gem colors palette`,
  },
};

// ── Generation Plan ──────────────────────────────────────────

// Classes with existing good lv4 (use lv4 as reference for lv1-3)
const REGEN_LOW = ['hunter', 'rogue', 'summoner', 'warrior'];
const LOW_LEVELS = ['lv1', 'lv2', 'lv3'];

// Classes needing full regeneration (use lv1 of themselves as reference for all)
const REGEN_FULL = ['priest', 'elder_wizard', 'merchant'];
const ALL_LEVELS = ['lv1', 'lv2', 'lv3', 'lv4', 'lv5', 'lv6'];

// ── Main ─────────────────────────────────────────────────────

async function generateSprite(cls, lv, refPath) {
  const outName = `${cls}_${lv}.png`;
  const rawPath = join(TEMP_DIR, `${cls}_${lv}_raw.png`);
  const finalPath = join(SPRITES_DIR, outName);

  console.log(`  ${outName}:`);
  console.log(`    Generating...`);

  const imgBuffer = await callGemini(refPath, PROMPTS[cls][lv]);

  if (!imgBuffer) {
    console.log(`    FAILED — skipping`);
    return false;
  }

  writeFileSync(rawPath, imgBuffer);
  console.log(`    Raw: ${Math.round(imgBuffer.length / 1024)}KB`);

  console.log(`    Post-processing...`);
  try {
    await postProcess(rawPath, finalPath);
    console.log(`    -> ${outName}`);
    return true;
  } catch (err) {
    console.error(`    Post-process error: ${err.message}`);
    try {
      await sharp(rawPath)
        .resize(CANVAS, CANVAS, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(finalPath);
      console.log(`    -> ${outName} (resize only)`);
      return true;
    } catch (err2) {
      console.error(`    Fallback failed: ${err2.message}`);
      return false;
    }
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Remaining Sprite Regeneration — Gemini 2.5 Flash     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`  Model: ${MODEL}`);
  console.log(`  Low-level (lv1-3): ${REGEN_LOW.length} classes × 3 = ${REGEN_LOW.length * 3}`);
  console.log(`  Full (lv1-6): ${REGEN_FULL.length} classes × 6 = ${REGEN_FULL.length * 6}`);
  console.log(`  Total API calls: ${REGEN_LOW.length * 3 + REGEN_FULL.length * 6}\n`);

  let generated = 0;
  let failed = 0;

  // ── Part 1: lv1-3 for Hunter, Rogue, Summoner, Warrior ──
  // Use their NEW lv4 as reference for style consistency
  for (const cls of REGEN_LOW) {
    const refPath = join(SPRITES_DIR, `${cls}_lv4.png`);
    console.log(`\n── ${cls.toUpperCase()} lv1-3 (ref: ${cls}_lv4.png) ──`);

    for (const lv of LOW_LEVELS) {
      const ok = await generateSprite(cls, lv, refPath);
      if (ok) generated++;
      else failed++;
      await sleep(2000);
    }
  }

  // ── Part 2: lv1-6 for Priest, Elder Wizard, Merchant ──
  // For lv1: generate from scratch-ish (use the current lv1 as style reference)
  // For lv2+: use the newly generated previous level as reference for progression
  for (const cls of REGEN_FULL) {
    console.log(`\n── ${cls.toUpperCase().replace('_', ' ')} lv1-6 ──`);

    // First generate lv1 using the current sprite as reference
    const currentLv1 = join(SPRITES_DIR, `${cls}_lv1.png`);
    let refPath = currentLv1;

    for (const lv of ALL_LEVELS) {
      console.log(`  (ref: ${refPath.split('/').pop()})`);
      const ok = await generateSprite(cls, lv, refPath);
      if (ok) {
        generated++;
        // Use the just-generated sprite as reference for next level
        refPath = join(SPRITES_DIR, `${cls}_${lv}.png`);
      } else {
        failed++;
      }
      await sleep(2000);
    }
  }

  // ── Part 3: Guardian lv1-3 (derived from Warrior) ──
  console.log('\n── GUARDIAN lv1-3 (derived from Warrior) ──');
  for (const lv of LOW_LEVELS) {
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

  // ── Part 4: Base sprites = copy from lv1 ──
  console.log('\n── BASE SPRITES (copy from lv1) ──');
  const ALL_CLASSES = ['hunter', 'rogue', 'summoner', 'warrior', 'priest', 'elder_wizard', 'merchant', 'guardian'];
  for (const cls of ALL_CLASSES) {
    const src = join(SPRITES_DIR, `${cls}_lv1.png`);
    const dst = join(SPRITES_DIR, `${cls}.png`);
    try {
      copyFileSync(src, dst);
      console.log(`  ${cls}.png (= ${cls}_lv1.png)`);
    } catch (err) {
      console.error(`  ${cls}.png FAILED: ${err.message}`);
    }
  }

  console.log(`\n════════════════════════════════════════════════════════`);
  console.log(`  Generated: ${generated}/${REGEN_LOW.length * 3 + REGEN_FULL.length * 6}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Guardian derived: 3`);
  console.log(`  Base sprites copied: 8`);
  console.log(`  Total sprites updated: ${generated + 3 + 8}`);
  console.log(`════════════════════════════════════════════════════════\n`);

  if (failed > 0) {
    console.log('Some sprites failed. Re-run or check the API.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
