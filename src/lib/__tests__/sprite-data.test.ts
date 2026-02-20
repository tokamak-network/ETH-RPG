import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

const mockedReadFileSync = vi.mocked(readFileSync);

describe('getSpriteSrc', () => {
  beforeEach(() => {
    vi.resetModules();
    mockedReadFileSync.mockReset();
  });

  it('returns a base64 data URL for a valid sprite file', async () => {
    const mockBuffer = Buffer.from('fake-png-data');
    mockedReadFileSync.mockReturnValue(mockBuffer);

    const { getSpriteSrc } = await import('@/lib/sprite-data');
    const result = getSpriteSrc('warrior', 10);

    expect(result).toBe(`data:image/png;base64,${mockBuffer.toString('base64')}`);
    expect(mockedReadFileSync).toHaveBeenCalledWith(
      expect.stringContaining('warrior_lv1.png'),
    );
  });

  it('falls back to base sprite when tiered version is missing', async () => {
    const fallbackBuffer = Buffer.from('base-sprite');
    mockedReadFileSync
      .mockImplementationOnce(() => { throw new Error('ENOENT'); })
      .mockReturnValueOnce(fallbackBuffer);

    const { getSpriteSrc } = await import('@/lib/sprite-data');
    const result = getSpriteSrc('hunter', 5);

    expect(result).toBe(`data:image/png;base64,${fallbackBuffer.toString('base64')}`);
    expect(mockedReadFileSync).toHaveBeenCalledTimes(2);
  });

  it('returns empty string when both tiered and base sprites are missing', async () => {
    mockedReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });

    const { getSpriteSrc } = await import('@/lib/sprite-data');
    const result = getSpriteSrc('rogue', 30);

    expect(result).toBe('');
  });

  it('uses cached result on repeated calls with same arguments', async () => {
    const mockBuffer = Buffer.from('sprite-data');
    mockedReadFileSync.mockReturnValue(mockBuffer);

    const { getSpriteSrc } = await import('@/lib/sprite-data');

    const first = getSpriteSrc('guardian', 10);
    const callsAfterFirst = mockedReadFileSync.mock.calls.length;

    const second = getSpriteSrc('guardian', 10);
    const callsAfterSecond = mockedReadFileSync.mock.calls.length;

    expect(first).toBe(second);
    expect(callsAfterSecond).toBe(callsAfterFirst); // no additional reads
  });

  it('caches fallback sprite path on repeated calls', async () => {
    const fallbackBuffer = Buffer.from('fallback-data');
    mockedReadFileSync
      .mockImplementationOnce(() => { throw new Error('ENOENT'); }) // tier miss
      .mockReturnValueOnce(fallbackBuffer); // fallback hit

    const { getSpriteSrc } = await import('@/lib/sprite-data');

    const first = getSpriteSrc('priest', 5);

    // Second call: tier filename not cached, so readFileSync is called once more
    // for the tier path (returns undefined → throws → catch block).
    // But fallback filename IS cached, so no additional read for fallback.
    const second = getSpriteSrc('priest', 5);

    expect(first).toBe(second);
    // 2 calls from first (tier miss + fallback read) + 1 from second (tier attempt) = 3
    expect(mockedReadFileSync).toHaveBeenCalledTimes(3);
  });
});
