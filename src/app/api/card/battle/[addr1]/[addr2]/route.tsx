// GET /api/card/battle/[addr1]/[addr2] — Downloadable battle comparison card (1080x1350)
import { ImageResponse } from 'next/og';
import { getCachedBattle } from '@/lib/battle-cache';
import { generateCharacterData } from '@/lib/pipeline';
import { simulateBattle } from '@/lib/battle';
import { getSpriteSrc } from '@/lib/sprite-data';
import { shortenAddress, formatFighterName } from '@/lib/format-utils';
import { isValidAddress, isValidNonce } from '@/lib/route-utils';
import { CLASS_THEMES, STAT_MAX_VALUES, STAT_COLORS } from '@/styles/themes';
import type { BattleFighter, BattleResult, CharacterClassId } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

const SUCCESS_CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' };
const ERROR_CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

// --- Compact stat bar for battle card ---

interface StatBarBattleProps {
  readonly label: string;
  readonly value: number;
  readonly maxValue: number;
  readonly color: string;
}

function StatBarBattle({ label, value, maxValue, color }: StatBarBattleProps) {
  const safeValue = value ?? 0;
  const percentage = Math.min(100, (safeValue / maxValue) * 100);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: 8,
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        width: 50,
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: 700,
        fontFamily: 'monospace',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        flex: 1,
        height: 14,
        borderRadius: 7,
        background: '#1a1a2e',
        overflow: 'hidden',
        marginLeft: 8,
        marginRight: 8,
      }}>
        <div style={{
          display: 'flex',
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: 7,
        }} />
      </div>
      <div style={{
        display: 'flex',
        width: 50,
        fontSize: 13,
        fontWeight: 600,
        justifyContent: 'flex-end',
      }}>
        <span style={{ display: 'flex', color: '#e8e8ed' }}>{safeValue}</span>
      </div>
    </div>
  );
}

// --- Fighter section for the battle card ---

interface FighterSectionProps {
  readonly fighter: BattleFighter;
  readonly isWinner: boolean;
}

function FighterSection({ fighter, isWinner }: FighterSectionProps) {
  const theme = CLASS_THEMES[fighter.class.id as CharacterClassId];
  const displayName = formatFighterName(fighter);
  const spriteSrc = getSpriteSrc(fighter.class.id as CharacterClassId, fighter.stats.level);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      width: '100%',
      padding: '0 60px',
    }}>
      {/* Class sprite or icon */}
      {spriteSrc ? (
        <img
          src={spriteSrc}
          width={80}
          height={80}
          style={{ imageRendering: 'pixelated' as const, marginBottom: 8 }}
        />
      ) : (
        <div style={{
          display: 'flex',
          fontSize: 64,
          marginBottom: 8,
        }}>
          {theme.icon}
        </div>
      )}

      {/* Class name */}
      <div style={{
        display: 'flex',
        fontSize: 36,
        fontWeight: 900,
        color: theme.primary,
        marginBottom: 4,
      }}>
        {fighter.class.name}
      </div>

      {/* Level + display name */}
      <div style={{
        display: 'flex',
        fontSize: 18,
        color: '#9ca3af',
        marginBottom: 8,
      }}>
        {`Lv. ${fighter.stats.level} | ${displayName}`}
      </div>

      {/* Winner badge */}
      {isWinner && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 16px',
          borderRadius: 12,
          backgroundColor: 'rgba(244, 196, 48, 0.15)',
          border: '1px solid rgba(244, 196, 48, 0.4)',
          marginBottom: 8,
        }}>
          <div style={{
            display: 'flex',
            fontSize: 16,
            fontWeight: 800,
            color: '#f4c430',
            letterSpacing: 2,
            textTransform: 'uppercase' as const,
          }}>
            {'\u2605 WINNER'}
          </div>
        </div>
      )}

      {/* Power */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 12,
      }}>
        <div style={{
          display: 'flex',
          fontSize: 14,
          color: '#9ca3af',
        }}>
          {'Power'}
        </div>
        <div style={{
          display: 'flex',
          fontSize: 36,
          fontWeight: 900,
          color: isWinner ? '#f4c430' : '#6b7280',
        }}>
          {fighter.stats.power.toLocaleString()}
        </div>
      </div>

      {/* Stat bars (HP, MP, STR, INT only for compactness) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column' as const,
        width: '100%',
      }}>
        <StatBarBattle label="HP" value={fighter.stats.hp} maxValue={STAT_MAX_VALUES.hp} color={STAT_COLORS.hp} />
        <StatBarBattle label="MP" value={fighter.stats.mp} maxValue={STAT_MAX_VALUES.mp} color={STAT_COLORS.mp} />
        <StatBarBattle label="STR" value={fighter.stats.str} maxValue={STAT_MAX_VALUES.str} color={STAT_COLORS.str} />
        <StatBarBattle label="INT" value={fighter.stats.int} maxValue={STAT_MAX_VALUES.int} color={STAT_COLORS.int} />
      </div>
    </div>
  );
}

// --- Error card ---

function ErrorCard() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      color: '#e8e8ed',
      border: '2px solid #2a2a3e',
      borderRadius: 16,
    }}>
      <div style={{
        display: 'flex',
        fontSize: 64,
        marginBottom: 20,
      }}>
        {'\u2694\uFE0F'}
      </div>
      <div style={{
        display: 'flex',
        fontSize: 36,
        fontWeight: 900,
        color: '#f4c430',
        marginBottom: 12,
      }}>
        {`Eth\u00B7RPG \u2014 Battle`}
      </div>
      <div style={{
        display: 'flex',
        fontSize: 22,
        color: '#9ca3af',
        textAlign: 'center' as const,
        padding: '0 60px',
      }}>
        {'Battle not found. Start a new battle at ethrpg.com'}
      </div>
      <div style={{
        display: 'flex',
        fontSize: 16,
        color: '#6b7280',
        marginTop: 16,
      }}>
        {'ethrpg.com'}
      </div>
    </div>
  );
}

// --- Battle comparison card ---

function BattleComparisonCard({ result }: { readonly result: BattleResult }) {
  const [fighter0, fighter1] = result.fighters;
  const winnerIndex = result.winner;
  const loserIndex = winnerIndex === 0 ? 1 : 0;
  const winnerFighter = result.fighters[winnerIndex];
  const loserFighter = result.fighters[loserIndex];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      background: '#0a0a0f',
      border: '2px solid #2a2a3e',
      borderRadius: 16,
      padding: '40px 0',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <div style={{
          display: 'flex',
          fontSize: 24,
          color: '#6b7280',
        }}>
          {`Eth\u00B7RPG \u2014 Battle`}
        </div>
      </div>

      {/* Winner section */}
      <FighterSection
        fighter={winnerFighter}
        isWinner={true}
      />

      {/* VS divider */}
      <div style={{
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        margin: '20px 0',
      }}>
        <div style={{
          display: 'flex',
          width: 800,
          height: 1,
          background: '#2a2a3e',
          marginBottom: 12,
        }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            display: 'flex',
            fontSize: 32,
            fontWeight: 900,
            color: '#f4c430',
          }}>
            {'\u2694\uFE0F VS \u2694\uFE0F'}
          </div>
        </div>
        <div style={{
          display: 'flex',
          fontSize: 16,
          color: '#9ca3af',
          marginTop: 6,
        }}>
          {`${result.totalTurns} turns \u00B7 ${result.winnerHpPercent}% HP left`}
        </div>
        <div style={{
          display: 'flex',
          width: 800,
          height: 1,
          background: '#2a2a3e',
          marginTop: 12,
        }} />
      </div>

      {/* Loser section */}
      <FighterSection
        fighter={loserFighter}
        isWinner={false}
      />

      {/* Spacer */}
      <div style={{ flex: 1, display: 'flex' }} />

      {/* Footer CTA */}
      <div style={{
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        marginTop: 24,
      }}>
        <div style={{
          display: 'flex',
          fontSize: 22,
          fontWeight: 700,
          color: '#f4c430',
          marginBottom: 8,
        }}>
          {'Who would YOU fight?'}
        </div>
        <div style={{
          display: 'flex',
          fontSize: 18,
          color: '#4a9eff',
          fontWeight: 600,
        }}>
          {'ethrpg.com'}
        </div>
      </div>
    </div>
  );
}

// --- GET handler ---

export async function GET(
  request: Request,
  { params }: { params: Promise<{ addr1: string; addr2: string }> },
): Promise<ImageResponse> {
  const { addr1, addr2 } = await params;
  const url = new URL(request.url);
  const nonce = url.searchParams.get('n');

  // Validate addresses
  if (!isValidAddress(addr1) || !isValidAddress(addr2)) {
    return new ImageResponse(<ErrorCard />, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      status: 400,
      headers: ERROR_CACHE_HEADERS,
    });
  }

  // Require a valid nonce
  if (!nonce || !isValidNonce(nonce)) {
    return new ImageResponse(<ErrorCard />, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      headers: ERROR_CACHE_HEADERS,
    });
  }

  try {
    // Try cache first
    const cached = await getCachedBattle(addr1, addr2, nonce);
    if (cached) {
      return new ImageResponse(
        <BattleComparisonCard result={cached.result} />,
        { width: CARD_WIDTH, height: CARD_HEIGHT, headers: SUCCESS_CACHE_HEADERS },
      );
    }

    // No cache: generate characters and simulate with the same nonce (deterministic)
    const [char1, char2] = await Promise.all([
      generateCharacterData(addr1, { skipAiLore: true }),
      generateCharacterData(addr2, { skipAiLore: true }),
    ]);

    const fighter0: BattleFighter = {
      address: char1.address,
      ...(char1.ensName ? { ensName: char1.ensName } : {}),
      class: char1.class,
      stats: char1.stats,
      achievements: char1.achievements,
    };
    const fighter1: BattleFighter = {
      address: char2.address,
      ...(char2.ensName ? { ensName: char2.ensName } : {}),
      class: char2.class,
      stats: char2.stats,
      achievements: char2.achievements,
    };

    const result = simulateBattle(fighter0, fighter1, nonce);

    return new ImageResponse(
      <BattleComparisonCard result={result} />,
      { width: CARD_WIDTH, height: CARD_HEIGHT, headers: SUCCESS_CACHE_HEADERS },
    );
  } catch {
    return new ImageResponse(<ErrorCard />, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      headers: ERROR_CACHE_HEADERS,
    });
  }
}
