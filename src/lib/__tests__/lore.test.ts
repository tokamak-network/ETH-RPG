import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildLoreUserPrompt,
  validateLore,
  generateFallbackLore,
  generateLore,
} from '@/lib/lore';
import { makeLoreInput } from './fixtures';

// ---------------------------------------------------------------------------
// 1. buildLoreUserPrompt
// ---------------------------------------------------------------------------
describe('buildLoreUserPrompt', () => {
  it('contains the class name', () => {
    const input = makeLoreInput({ className: 'Hunter', classNameEn: 'Hunter' });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('Hunter');
  });

  it('contains level and power values', () => {
    const input = makeLoreInput({ level: 25, power: 42000 });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('Level: 25');
    expect(prompt).toContain('Power: 42000');
  });

  it('contains transaction count', () => {
    const input = makeLoreInput({ txCount: 500 });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('Total Transactions: 500');
  });

  it('shows fallback text when no relevant events exist', () => {
    const input = makeLoreInput({ relevantEvents: [] });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('No notable events experienced');
  });

  it('lists relevant events when they exist', () => {
    const input = makeLoreInput({
      relevantEvents: ['Ritual of the Great Merge', 'Fall of the Lunar Kingdom'],
    });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('Events Experienced: Ritual of the Great Merge, Fall of the Lunar Kingdom');
  });
});

// ---------------------------------------------------------------------------
// 2. validateLore
// ---------------------------------------------------------------------------
describe('validateLore', () => {
  it('returns trimmed text', () => {
    const result = validateLore('  A legendary warrior has appeared.  ');

    expect(result).toBe('A legendary warrior has appeared.');
  });

  it('replaces forbidden word ETH with ***', () => {
    const result = validateLore('This warrior holds 100 ETH in reserves.');

    expect(result).toContain('***');
    expect(result).not.toContain('ETH');
  });

  it('replaces multiple forbidden words', () => {
    const result = validateLore('ETH invest USD gains.');

    expect(result).not.toContain('ETH');
    expect(result).not.toContain('invest');
    expect(result).not.toContain('USD');
    // Each forbidden word replaced with ***
    expect(result.match(/\*\*\*/g)?.length).toBe(3);
  });

  it('truncates text exceeding 80 characters to 77 chars + ellipsis', () => {
    // Create a string that is exactly 90 characters long
    const longText = 'a'.repeat(90);
    const result = validateLore(longText);

    expect(result.length).toBe(80);
    expect(result.endsWith('...')).toBe(true);
    expect(result.slice(0, 77)).toBe('a'.repeat(77));
  });

  it('passes through short text unchanged', () => {
    const shortText = 'A short lore.';
    const result = validateLore(shortText);

    expect(result).toBe(shortText);
  });

  it('handles text with both forbidden words and overlength', () => {
    // Build a long string containing a forbidden word
    const text = 'ETH' + 'a'.repeat(100);
    const result = validateLore(text);

    // ETH -> ***, then truncated
    expect(result).not.toContain('ETH');
    expect(result.length).toBe(80);
    expect(result.endsWith('...')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. generateFallbackLore
// ---------------------------------------------------------------------------
describe('generateFallbackLore', () => {
  const WARRIOR_TEMPLATES = [
    'No special powers, but a warrior who steadily marches to battle.',
    'A warrior who walked the blockchain battlefield with a single ordinary sword.',
  ];

  const HUNTER_TEMPLATES = [
    'This hunter roamed the battlefield, collecting countless relics.',
    'Drawn by the call of ancient relics, an endless hunt continues.',
  ];

  const ELDER_WIZARD_TEMPLATES = [
    'An ancient wizard who watched for ages, accumulating wisdom.',
    'Awakened long ago, now in seclusion, waiting for the right moment.',
  ];

  it('returns one of the warrior templates for Warrior class', () => {
    const input = makeLoreInput({ classNameEn: 'Warrior' });
    const result = generateFallbackLore(input);

    expect(WARRIOR_TEMPLATES).toContain(result);
  });

  it('returns one of the hunter templates for Hunter class', () => {
    const input = makeLoreInput({
      className: 'Hunter',
      classNameEn: 'Hunter',
    });
    const result = generateFallbackLore(input);

    expect(HUNTER_TEMPLATES).toContain(result);
  });

  it('converts Elder Wizard classNameEn to elder_wizard key', () => {
    const input = makeLoreInput({
      className: 'Elder Wizard',
      classNameEn: 'Elder Wizard',
    });
    const result = generateFallbackLore(input);

    expect(ELDER_WIZARD_TEMPLATES).toContain(result);
  });

  it('is deterministic -- same input always produces the same output', () => {
    const input = makeLoreInput({ classNameEn: 'Hunter', level: 15, power: 20000, txCount: 200 });
    const first = generateFallbackLore(input);
    const second = generateFallbackLore(input);
    const third = generateFallbackLore(input);

    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('falls back to warrior templates for an unknown class', () => {
    const input = makeLoreInput({ classNameEn: 'Necromancer' });
    const result = generateFallbackLore(input);

    expect(WARRIOR_TEMPLATES).toContain(result);
  });
});

// ---------------------------------------------------------------------------
// 4. generateLore (async, requires mocks)
// ---------------------------------------------------------------------------
describe('generateLore', () => {
  const originalEnv = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalEnv !== undefined) {
      process.env.ANTHROPIC_API_KEY = originalEnv;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('returns fallback lore when no API key is set', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await generateLore(makeLoreInput());

    expect(result).toBeTruthy();
    // Should be one of the warrior fallback templates
    expect([
      'No special powers, but a warrior who steadily marches to battle.',
      'A warrior who walked the blockchain battlefield with a single ordinary sword.',
    ]).toContain(result);
  });

  it('returns validated AI response on successful API call', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const mockResponse = {
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'A legendary warrior has appeared.' }],
      }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await generateLore(makeLoreInput());

    expect(result).toBe('A legendary warrior has appeared.');
  });

  it('returns fallback lore when API returns non-ok status', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const mockResponse = {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await generateLore(makeLoreInput());

    expect([
      'No special powers, but a warrior who steadily marches to battle.',
      'A warrior who walked the blockchain battlefield with a single ordinary sword.',
    ]).toContain(result);
  });

  it('returns fallback lore when API returns empty text', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const mockResponse = {
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '   ' }],
      }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await generateLore(makeLoreInput());

    expect([
      'No special powers, but a warrior who steadily marches to battle.',
      'A warrior who walked the blockchain battlefield with a single ordinary sword.',
    ]).toContain(result);
  });

  it('returns fallback lore when fetch throws an error', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await generateLore(makeLoreInput());

    expect([
      'No special powers, but a warrior who steadily marches to battle.',
      'A warrior who walked the blockchain battlefield with a single ordinary sword.',
    ]).toContain(result);
  });
});
