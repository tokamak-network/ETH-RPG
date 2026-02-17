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
  it('contains the class name in Korean and English', () => {
    const input = makeLoreInput({ className: '사냥꾼(Hunter)', classNameEn: 'Hunter' });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('사냥꾼(Hunter)');
    expect(prompt).toContain('Hunter');
  });

  it('contains level and power values', () => {
    const input = makeLoreInput({ level: 25, power: 42000 });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('레벨: 25');
    expect(prompt).toContain('전투력: 42000');
  });

  it('contains transaction count', () => {
    const input = makeLoreInput({ txCount: 500 });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('총 트랜잭션: 500회');
  });

  it('shows fallback text when no relevant events exist', () => {
    const input = makeLoreInput({ relevantEvents: [] });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('특별한 사건 경험 없음');
  });

  it('lists relevant events when they exist', () => {
    const input = makeLoreInput({
      relevantEvents: ['대통합의 의식', '달의 왕국 붕괴'],
    });
    const prompt = buildLoreUserPrompt(input);

    expect(prompt).toContain('경험한 사건: 대통합의 의식, 달의 왕국 붕괴');
  });
});

// ---------------------------------------------------------------------------
// 2. validateLore
// ---------------------------------------------------------------------------
describe('validateLore', () => {
  it('returns trimmed text', () => {
    const result = validateLore('  전설의 전사가 나타났다.  ');

    expect(result).toBe('전설의 전사가 나타났다.');
  });

  it('replaces forbidden word ETH with ***', () => {
    const result = validateLore('이 전사는 100 ETH를 보유하고 있다.');

    expect(result).toContain('***');
    expect(result).not.toContain('ETH');
  });

  it('replaces multiple forbidden words', () => {
    const result = validateLore('ETH 투자로 USD를 벌었다.');

    expect(result).not.toContain('ETH');
    expect(result).not.toContain('투자');
    expect(result).not.toContain('USD');
    // Each forbidden word replaced with ***
    expect(result.match(/\*\*\*/g)?.length).toBe(3);
  });

  it('truncates text exceeding 80 characters to 77 chars + ellipsis', () => {
    // Create a string that is exactly 90 characters long (Korean chars)
    const longText = '가'.repeat(90);
    const result = validateLore(longText);

    expect(result.length).toBe(80);
    expect(result.endsWith('...')).toBe(true);
    expect(result.slice(0, 77)).toBe('가'.repeat(77));
  });

  it('passes through short text unchanged', () => {
    const shortText = '짧은 서사.';
    const result = validateLore(shortText);

    expect(result).toBe(shortText);
  });

  it('handles text with both forbidden words and overlength', () => {
    // Build a long string containing a forbidden word
    const text = 'ETH' + '가'.repeat(100);
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
    '특별한 힘은 없지만 꾸준히 전장에 나서는 전사.',
    '평범한 검 하나로 블록체인의 전장을 걸어온 전사.',
  ];

  const HUNTER_TEMPLATES = [
    '이 사냥꾼은 수많은 유물을 수집하며 전장을 누볐다.',
    '고대 유물의 부름에 이끌려 끝없는 사냥을 이어가는 자.',
  ];

  const ELDER_WIZARD_TEMPLATES = [
    '오랜 세월을 관망하며 지혜를 쌓아온 고대 마법사.',
    '오래전 각성했으나, 지금은 은둔하며 때를 기다리는 자.',
  ];

  it('returns one of the warrior templates for Warrior class', () => {
    const input = makeLoreInput({ classNameEn: 'Warrior' });
    const result = generateFallbackLore(input);

    expect(WARRIOR_TEMPLATES).toContain(result);
  });

  it('returns one of the hunter templates for Hunter class', () => {
    const input = makeLoreInput({
      className: '사냥꾼(Hunter)',
      classNameEn: 'Hunter',
    });
    const result = generateFallbackLore(input);

    expect(HUNTER_TEMPLATES).toContain(result);
  });

  it('converts Elder Wizard classNameEn to elder_wizard key', () => {
    const input = makeLoreInput({
      className: '고대 마법사(Elder Wizard)',
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
      '특별한 힘은 없지만 꾸준히 전장에 나서는 전사.',
      '평범한 검 하나로 블록체인의 전장을 걸어온 전사.',
    ]).toContain(result);
  });

  it('returns validated AI response on successful API call', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const mockResponse = {
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '전설의 전사가 나타났다.' }],
      }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await generateLore(makeLoreInput());

    expect(result).toBe('전설의 전사가 나타났다.');
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
      '특별한 힘은 없지만 꾸준히 전장에 나서는 전사.',
      '평범한 검 하나로 블록체인의 전장을 걸어온 전사.',
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
      '특별한 힘은 없지만 꾸준히 전장에 나서는 전사.',
      '평범한 검 하나로 블록체인의 전장을 걸어온 전사.',
    ]).toContain(result);
  });

  it('returns fallback lore when fetch throws an error', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await generateLore(makeLoreInput());

    expect([
      '특별한 힘은 없지만 꾸준히 전장에 나서는 전사.',
      '평범한 검 하나로 블록체인의 전장을 걸어온 전사.',
    ]).toContain(result);
  });
});
