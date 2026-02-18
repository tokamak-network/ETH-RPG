/**
 * Test Gemini 2.5 Flash image generation for sprite regeneration.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

// Load env
const envContent = readFileSync(join(PROJECT_ROOT, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^(\w+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const BASE_URL = env.LITELLM_BASE_URL;
const API_KEY = env.LITELLM_API_KEY;
const MODEL = 'gemini-2.5-flash-image';

async function generateSprite(inputPath, prompt, outputPath) {
  const spriteBuffer = readFileSync(inputPath);
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

  console.log(`  Requesting ${MODEL}...`);
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
    console.error('  ERROR:', JSON.stringify(data.error));
    return false;
  }

  const msg = data.choices?.[0]?.message;
  if (!msg) {
    console.error('  No message in response:', JSON.stringify(data).slice(0, 500));
    return false;
  }

  // Check msg.images (LiteLLM/Gemini format)
  if (Array.isArray(msg.images) && msg.images.length > 0) {
    const url = msg.images[0].image_url?.url || '';
    const b64 = url.replace(/^data:image\/\w+;base64,/, '');
    if (b64.length > 100) {
      writeFileSync(outputPath, Buffer.from(b64, 'base64'));
      console.log(`  -> Saved image to ${outputPath} (${Math.round(b64.length / 1024)}KB)`);
      return true;
    }
  }

  const content = msg.content;

  // Handle array content (multimodal response)
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url') {
        const url = part.image_url?.url || '';
        const b64 = url.replace(/^data:image\/\w+;base64,/, '');
        writeFileSync(outputPath, Buffer.from(b64, 'base64'));
        console.log(`  -> Saved image to ${outputPath}`);
        return true;
      }
      if (part.type === 'text' && part.text) {
        console.log(`  Text: ${part.text.slice(0, 100)}`);
      }
    }
  }

  // Handle string content with embedded base64
  if (typeof content === 'string') {
    const imgMatch = content.match(/data:image\/\w+;base64,([A-Za-z0-9+/=]+)/);
    if (imgMatch) {
      writeFileSync(outputPath, Buffer.from(imgMatch[1], 'base64'));
      console.log(`  -> Saved image to ${outputPath}`);
      return true;
    }
    console.log(`  Text response: ${content.slice(0, 300)}`);
  }

  console.error('  No image found in response');
  console.log('  Response structure:', JSON.stringify(data, null, 2).slice(0, 500));
  return false;
}

// Test with warrior_lv5 -> rogue-style
const input = join(PROJECT_ROOT, 'public/sprites/warrior_lv5.png');
const output = '/tmp/gemini_sprite_test.png';
const prompt = `This is a pixel art RPG warrior character sprite on a transparent background.
Generate a similar pixel art sprite but redesigned as a rogue/assassin class - dark hood, dual daggers, leather armor, stealthy crouching pose.
Keep the same pixel art style, similar size, and transparent background. Only output the image.`;

console.log('Testing Gemini sprite generation...');
console.log(`Input: ${input}`);
console.log(`Model: ${MODEL}`);

generateSprite(input, prompt, output)
  .then(ok => {
    if (ok) console.log('\nSuccess! Check /tmp/gemini_sprite_test.png');
    else console.log('\nFailed to generate image.');
  })
  .catch(err => console.error('Error:', err.message));
