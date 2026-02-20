import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildLoreUserPrompt,
  buildLongLoreUserPrompt,
  validateLore,
  validateLongLore,
  generateFallbackLore,
  generateLongFallbackLore,
  generateLore,
  generateLongLore,
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

  it('replaces lowercase forbidden word "eth"', () => {
    const result = validateLore('The hero earned 50 eth in quests.');

    expect(result).not.toContain('eth');
    expect(result).toContain('***');
  });

  it('replaces mixed-case forbidden word "Eth"', () => {
    const result = validateLore('Eth treasures awaited the brave.');

    expect(result).not.toMatch(/eth/i);
    expect(result).toContain('***');
  });

  it('replaces capitalized forbidden word "Invest"', () => {
    const result = validateLore('Invest wisely in the realm.');

    expect(result).not.toMatch(/invest/i);
    expect(result).toContain('***');
  });

  it('replaces all case variants in one pass', () => {
    const result = validateLore('eth ETH Eth are all blocked.');

    expect(result).not.toMatch(/eth/i);
    // 3 replacements
    expect(result.match(/\*\*\*/g)?.length).toBe(3);
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

  // --- LiteLLM paths ---

  it('uses LiteLLM primary model when LITELLM_API_KEY is set', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.LITELLM_API_KEY = 'litellm-key';
    process.env.LITELLM_BASE_URL = 'http://test-litellm:4000';
    process.env.LITELLM_MODEL = 'test-model';

    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'A hero forged in battle.' } }],
      }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await generateLore(makeLoreInput());

    expect(result).toBe('A hero forged in battle.');
    expect(fetch).toHaveBeenCalledWith(
      'http://test-litellm:4000/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );

    delete process.env.LITELLM_API_KEY;
    delete process.env.LITELLM_BASE_URL;
    delete process.env.LITELLM_MODEL;
  });

  it('falls to LiteLLM fallback model when primary returns null', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.LITELLM_API_KEY = 'litellm-key';
    process.env.LITELLM_BASE_URL = 'http://test-litellm:4000';
    process.env.LITELLM_MODEL = 'primary-model';
    process.env.LITELLM_FALLBACK_MODEL = 'fallback-model';

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false }) // primary fails
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Fallback hero emerges.' } }],
        }),
      }); // fallback succeeds
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateLore(makeLoreInput());

    expect(result).toBe('Fallback hero emerges.');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    delete process.env.LITELLM_API_KEY;
    delete process.env.LITELLM_BASE_URL;
    delete process.env.LITELLM_MODEL;
    delete process.env.LITELLM_FALLBACK_MODEL;
  });

  it('falls to Anthropic direct when LiteLLM primary throws', async () => {
    process.env.LITELLM_API_KEY = 'litellm-key';
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';

    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('LiteLLM down')) // LiteLLM throws
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'Anthropic fallback lore.' }],
        }),
      }); // Anthropic succeeds
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateLore(makeLoreInput());

    expect(result).toBe('Anthropic fallback lore.');

    delete process.env.LITELLM_API_KEY;
  });

  it('falls to template when both LiteLLM and Anthropic fail', async () => {
    process.env.LITELLM_API_KEY = 'litellm-key';
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await generateLore(makeLoreInput());

    expect([
      'No special powers, but a warrior who steadily marches to battle.',
      'A warrior who walked the blockchain battlefield with a single ordinary sword.',
    ]).toContain(result);

    delete process.env.LITELLM_API_KEY;
  });

  it('handles LiteLLM returning empty content', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.LITELLM_API_KEY = 'litellm-key';

    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '   ' } }],
      }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await generateLore(makeLoreInput());

    // Empty content falls through to template
    expect([
      'No special powers, but a warrior who steadily marches to battle.',
      'A warrior who walked the blockchain battlefield with a single ordinary sword.',
    ]).toContain(result);

    delete process.env.LITELLM_API_KEY;
  });

  it('handles LiteLLM returning no choices', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.LITELLM_API_KEY = 'litellm-key';

    const mockResponse = {
      ok: true,
      json: async () => ({ choices: [] }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await generateLore(makeLoreInput());

    expect([
      'No special powers, but a warrior who steadily marches to battle.',
      'A warrior who walked the blockchain battlefield with a single ordinary sword.',
    ]).toContain(result);

    delete process.env.LITELLM_API_KEY;
  });
});

// ---------------------------------------------------------------------------
// 5. buildLongLoreUserPrompt
// ---------------------------------------------------------------------------
describe('buildLongLoreUserPrompt', () => {
  it('contains the class name and level', () => {
    const input = makeLoreInput({ className: 'Rogue', classNameEn: 'Rogue', level: 30 });
    const prompt = buildLongLoreUserPrompt(input);

    expect(prompt).toContain('Rogue');
    expect(prompt).toContain('Level: 30');
  });

  it('requests 3-5 sentences within 400 characters', () => {
    const input = makeLoreInput();
    const prompt = buildLongLoreUserPrompt(input);

    expect(prompt).toContain('3-5 sentences');
    expect(prompt).toContain('400 characters');
  });

  it('shows no-events fallback when relevantEvents is empty', () => {
    const input = makeLoreInput({ relevantEvents: [] });
    const prompt = buildLongLoreUserPrompt(input);

    expect(prompt).toContain('No notable events experienced');
  });

  it('lists relevant events when they exist', () => {
    const input = makeLoreInput({
      relevantEvents: ['The Great Mana Famine'],
    });
    const prompt = buildLongLoreUserPrompt(input);

    expect(prompt).toContain('Events Experienced: The Great Mana Famine');
  });
});

// ---------------------------------------------------------------------------
// 6. validateLongLore
// ---------------------------------------------------------------------------
describe('validateLongLore', () => {
  it('passes through text under 400 characters', () => {
    const text = 'A short long lore text.';
    expect(validateLongLore(text)).toBe(text);
  });

  it('truncates text exceeding 400 characters', () => {
    const longText = 'a'.repeat(450);
    const result = validateLongLore(longText);

    expect(result.length).toBe(400);
    expect(result.endsWith('...')).toBe(true);
  });

  it('replaces forbidden words', () => {
    const text = 'This hero invested 100 ETH wisely.';
    const result = validateLongLore(text);

    expect(result).not.toContain('ETH');
    expect(result).not.toContain('invest');
  });
});

// ---------------------------------------------------------------------------
// 7. generateLongFallbackLore
// ---------------------------------------------------------------------------
describe('generateLongFallbackLore', () => {
  const WARRIOR_LONG = [
    'No special magic, no legendary weapons. All this warrior has is perseverance and will. The journey of this warrior, who marched to battle every day taking one step at a time, is an epic saga in itself.',
    'This warrior, who walked the blockchain battlefield with a single ordinary sword, may not be flashy but possesses an unbreakable will. The experience forged through countless battles is worth more than any legendary weapon.',
  ];

  it('returns one of the long warrior templates for Warrior class', () => {
    const input = makeLoreInput({ classNameEn: 'Warrior' });
    const result = generateLongFallbackLore(input);

    expect(WARRIOR_LONG).toContain(result);
  });

  it('is deterministic', () => {
    const input = makeLoreInput({ classNameEn: 'Warrior', level: 10, power: 15000, txCount: 100 });
    const first = generateLongFallbackLore(input);
    const second = generateLongFallbackLore(input);

    expect(first).toBe(second);
  });

  it('falls back to warrior templates for an unknown class', () => {
    const input = makeLoreInput({ classNameEn: 'Necromancer' });
    const result = generateLongFallbackLore(input);

    expect(WARRIOR_LONG).toContain(result);
  });

  it('handles Elder Wizard with space in classNameEn', () => {
    const input = makeLoreInput({ classNameEn: 'Elder Wizard' });
    const result = generateLongFallbackLore(input);

    expect(result.length).toBeGreaterThan(80);
    expect(result.length).toBeLessThanOrEqual(400);
  });
});

// ---------------------------------------------------------------------------
// 8. generateLongLore (async)
// ---------------------------------------------------------------------------
describe('generateLongLore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LITELLM_API_KEY;
    delete process.env.LITELLM_BASE_URL;
    delete process.env.LITELLM_MODEL;
    delete process.env.LITELLM_FALLBACK_MODEL;
    delete process.env.ANTHROPIC_API_KEY;
  });

  const WARRIOR_LONG = [
    'No special magic, no legendary weapons. All this warrior has is perseverance and will. The journey of this warrior, who marched to battle every day taking one step at a time, is an epic saga in itself.',
    'This warrior, who walked the blockchain battlefield with a single ordinary sword, may not be flashy but possesses an unbreakable will. The experience forged through countless battles is worth more than any legendary weapon.',
  ];

  it('returns long fallback lore when no API key is set', async () => {
    const result = await generateLongLore(makeLoreInput());

    expect(WARRIOR_LONG).toContain(result);
  });

  it('returns validated AI response via LiteLLM', async () => {
    process.env.LITELLM_API_KEY = 'litellm-key';
    process.env.LITELLM_BASE_URL = 'http://test:4000';

    const longText = 'An epic saga of a warrior who marched through the blockchain realm.';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: longText } }],
      }),
    }));

    const result = await generateLongLore(makeLoreInput());

    expect(result).toBe(longText);
  });

  it('falls to LiteLLM fallback model when primary fails', async () => {
    process.env.LITELLM_API_KEY = 'litellm-key';
    process.env.LITELLM_FALLBACK_MODEL = 'fallback-model';

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Long fallback lore text.' } }],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateLongLore(makeLoreInput());

    expect(result).toBe('Long fallback lore text.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls to Anthropic direct when LiteLLM throws', async () => {
    process.env.LITELLM_API_KEY = 'litellm-key';
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';

    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('LiteLLM timeout'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'Anthropic direct long lore.' }],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateLongLore(makeLoreInput());

    expect(result).toBe('Anthropic direct long lore.');
  });

  it('falls to template when all API calls fail', async () => {
    process.env.LITELLM_API_KEY = 'litellm-key';
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await generateLongLore(makeLoreInput());

    expect(WARRIOR_LONG).toContain(result);
  });

  it('falls to template when Anthropic returns empty content', async () => {
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '' }],
      }),
    }));

    const result = await generateLongLore(makeLoreInput());

    expect(WARRIOR_LONG).toContain(result);
  });

  it('falls to template when Anthropic has no text block', async () => {
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'image', text: '' }],
      }),
    }));

    const result = await generateLongLore(makeLoreInput());

    expect(WARRIOR_LONG).toContain(result);
  });

  it('validates long lore text from LiteLLM (sanitizes forbidden words)', async () => {
    process.env.LITELLM_API_KEY = 'litellm-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'The hero invested 100 ETH bravely.' } }],
      }),
    }));

    const result = await generateLongLore(makeLoreInput());

    expect(result).not.toContain('ETH');
    expect(result).not.toContain('invest');
  });

  it('handles LiteLLM primary throw then fallback throw then Anthropic throw', async () => {
    process.env.LITELLM_API_KEY = 'litellm-key';
    process.env.LITELLM_FALLBACK_MODEL = 'fallback-model';
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('All APIs down')));

    const result = await generateLongLore(makeLoreInput());

    expect(WARRIOR_LONG).toContain(result);
  });
});
