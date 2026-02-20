import { describe, it, expect } from 'vitest';
import { isMetricEvent, isBattleRecord } from '@/lib/kv-guards';

describe('isMetricEvent', () => {
  it('returns true for a valid MetricEvent', () => {
    expect(isMetricEvent({ name: 'generate', timestamp: 1700000000 })).toBe(true);
  });

  it('returns true when optional properties field is present', () => {
    expect(isMetricEvent({ name: 'share', timestamp: 1700000000, properties: { platform: 'twitter' } })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isMetricEvent(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isMetricEvent('string')).toBe(false);
  });

  it('returns false when name is missing', () => {
    expect(isMetricEvent({ timestamp: 1700000000 })).toBe(false);
  });

  it('returns false when timestamp is missing', () => {
    expect(isMetricEvent({ name: 'generate' })).toBe(false);
  });

  it('returns false when name is not a string', () => {
    expect(isMetricEvent({ name: 123, timestamp: 1700000000 })).toBe(false);
  });

  it('returns false when timestamp is not a number', () => {
    expect(isMetricEvent({ name: 'generate', timestamp: '1700000000' })).toBe(false);
  });
});

describe('isBattleRecord', () => {
  const validRecord = {
    seasonId: 's1',
    address: '0xabc',
    opponentAddress: '0xdef',
    won: true,
    power: 5000,
    opponentPower: 4500,
    nonce: 'uuid-1234',
    recordedAt: 1700000000,
  };

  it('returns true for a valid BattleRecord', () => {
    expect(isBattleRecord(validRecord)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isBattleRecord(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isBattleRecord(42)).toBe(false);
  });

  it('returns false when seasonId is missing', () => {
    const { seasonId: _, ...rest } = validRecord;
    expect(isBattleRecord(rest)).toBe(false);
  });

  it('returns false when won is not boolean', () => {
    expect(isBattleRecord({ ...validRecord, won: 1 })).toBe(false);
  });

  it('returns false when power is not a number', () => {
    expect(isBattleRecord({ ...validRecord, power: '5000' })).toBe(false);
  });

  it('returns false when nonce is missing', () => {
    const { nonce: _, ...rest } = validRecord;
    expect(isBattleRecord(rest)).toBe(false);
  });

  it('returns false when recordedAt is not a number', () => {
    expect(isBattleRecord({ ...validRecord, recordedAt: 'now' })).toBe(false);
  });
});
