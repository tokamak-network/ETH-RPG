import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  CRYPTO_EVENTS,
  getRelevantEvents,
  describeActivityPattern,
  formatWalletAge,
} from '@/lib/crypto-events';
import { makeClassification } from './fixtures';

// MS_PER_MONTH mirrors the source constant: 1000 * 60 * 60 * 24 * 30
const MS_PER_MONTH = 2_592_000_000;

// ---------------------------------------------------------------------------
// getRelevantEvents
// ---------------------------------------------------------------------------
describe('getRelevantEvents', () => {
  it('returns empty array when firstTx is null', () => {
    const result = getRelevantEvents(null, Date.now());

    expect(result).toEqual([]);
  });

  it('returns empty array when lastTx is null', () => {
    const result = getRelevantEvents(Date.now(), null);

    expect(result).toEqual([]);
  });

  it('returns empty array when both firstTx and lastTx are null', () => {
    const result = getRelevantEvents(null, null);

    expect(result).toEqual([]);
  });

  it('returns all 12 events when range covers 2020-01-01 to 2025-01-01', () => {
    const first = new Date('2020-01-01').getTime();
    const last = new Date('2025-01-01').getTime();

    const result = getRelevantEvents(first, last);

    expect(result).toHaveLength(12);
    expect(result).toEqual(CRYPTO_EVENTS.map((e) => e.rpgEvent));
  });

  it('returns empty array when range covers no events (2019-01-01 to 2019-12-31)', () => {
    const first = new Date('2019-01-01').getTime();
    const last = new Date('2019-12-31').getTime();

    const result = getRelevantEvents(first, last);

    expect(result).toEqual([]);
  });

  it('returns exactly one event when range matches a single event date (the Merge)', () => {
    const mergeDate = new Date('2022-09-15').getTime();

    const result = getRelevantEvents(mergeDate, mergeDate);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe('대통합의 의식에 참여했다');
  });

  it('returns 3 events when range covers 2021 only', () => {
    const first = new Date('2021-01-01').getTime();
    const last = new Date('2021-12-31').getTime();

    const result = getRelevantEvents(first, last);

    expect(result).toHaveLength(3);
    expect(result).toContain('고대 유물 수집의 시대를 열었다');
    expect(result).toContain('대폭락의 전장에서 살아남았다');
    expect(result).toContain('전설의 첫 번째 봉우리에 도달했다');
  });

  it('includes events when firstTx and lastTx are exact event dates', () => {
    const first = new Date('2020-03-12').getTime(); // Black Swan
    const last = new Date('2020-08-01').getTime();  // DeFi Summer

    const result = getRelevantEvents(first, last);

    expect(result).toHaveLength(2);
    expect(result).toContain('검은 백조의 습격을 견뎌냈다');
    expect(result).toContain('탈중앙 해방전쟁에 참전했다');
  });
});

// ---------------------------------------------------------------------------
// describeActivityPattern
// ---------------------------------------------------------------------------
describe('describeActivityPattern', () => {
  it('returns default message when all classification values are zero', () => {
    const classification = makeClassification();

    const result = describeActivityPattern(classification);

    expect(result).toBe('일반적인 트랜잭션 활동');
  });

  it('includes NFT pattern when nftRatio exceeds threshold', () => {
    const classification = makeClassification({ nftRatio: 0.21 });

    const result = describeActivityPattern(classification);

    expect(result).toContain('NFT 수집/민팅 활발');
  });

  it('includes DEX pattern when dexRatio exceeds threshold', () => {
    const classification = makeClassification({ dexRatio: 0.16 });

    const result = describeActivityPattern(classification);

    expect(result).toContain('DEX 스왑 빈번');
  });

  it('includes bridge pattern when bridgeCount exceeds threshold', () => {
    const classification = makeClassification({ bridgeCount: 4 });

    const result = describeActivityPattern(classification);

    expect(result).toContain('크로스체인 이동 경험');
  });

  it('includes stable pattern when stableRatio exceeds threshold', () => {
    const classification = makeClassification({ stableRatio: 0.26 });

    const result = describeActivityPattern(classification);

    expect(result).toContain('스테이블코인 중심 활동');
  });

  it('includes contract pattern when contractInteractions exceeds threshold', () => {
    const classification = makeClassification({ contractInteractions: 101 });

    const result = describeActivityPattern(classification);

    expect(result).toContain('컨트랙트 상호작용 활발');
  });

  it('returns comma-separated string when multiple patterns match', () => {
    const classification = makeClassification({
      nftRatio: 0.3,
      dexRatio: 0.2,
      bridgeCount: 5,
    });

    const result = describeActivityPattern(classification);

    expect(result).toBe('NFT 수집/민팅 활발, DEX 스왑 빈번, 크로스체인 이동 경험');
  });

  it('does NOT include patterns when values are exactly at threshold (strictly greater)', () => {
    const classification = makeClassification({
      nftRatio: 0.2,
      dexRatio: 0.15,
      bridgeCount: 3,
      stableRatio: 0.25,
      contractInteractions: 100,
    });

    const result = describeActivityPattern(classification);

    expect(result).toBe('일반적인 트랜잭션 활동');
  });
});

// ---------------------------------------------------------------------------
// formatWalletAge
// ---------------------------------------------------------------------------
describe('formatWalletAge', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "신규" when firstTxTimestamp is null', () => {
    const result = formatWalletAge(null);

    expect(result).toBe('신규');
  });

  it('returns "2년 3개월" for a wallet that is 27 months old', () => {
    const fixedNow = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const firstTx = fixedNow - 27 * MS_PER_MONTH;

    const result = formatWalletAge(firstTx);

    expect(result).toBe('2년 3개월');
  });

  it('returns "1개월 미만" when wallet age is less than one month', () => {
    const fixedNow = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    // Half a month ago
    const firstTx = fixedNow - Math.floor(MS_PER_MONTH / 2);

    const result = formatWalletAge(firstTx);

    expect(result).toBe('1개월 미만');
  });

  it('returns "6개월" for a wallet that is exactly 6 months old', () => {
    const fixedNow = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const firstTx = fixedNow - 6 * MS_PER_MONTH;

    const result = formatWalletAge(firstTx);

    expect(result).toBe('6개월');
  });

  it('returns "1년" for a wallet that is exactly 12 months old', () => {
    const fixedNow = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const firstTx = fixedNow - 12 * MS_PER_MONTH;

    const result = formatWalletAge(firstTx);

    expect(result).toBe('1년');
  });
});
