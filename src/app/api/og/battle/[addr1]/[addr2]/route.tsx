// GET /api/og/battle/[addr1]/[addr2] — Dynamic battle OG image (1200x630)
import { ImageResponse } from 'next/og';
import { generateCharacterData } from '@/lib/pipeline';
import { simulateBattle } from '@/lib/battle';
import { getCachedBattle } from '@/lib/battle-cache';
import { CLASS_THEMES } from '@/styles/themes';
import type { BattleFighter, BattleResult, CharacterClassId } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ENS_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.eth$/;

const SUCCESS_CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' };
const ERROR_CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

function isValidInput(input: string): boolean {
  return ETH_ADDRESS_REGEX.test(input) || ENS_REGEX.test(input);
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getDisplayName(fighter: BattleFighter): string {
  return fighter.ensName ?? shortenAddress(fighter.address);
}

function getMatchupLabel(
  advantage: 'advantaged' | 'disadvantaged' | 'neutral',
): string {
  switch (advantage) {
    case 'advantaged':
      return 'Advantaged';
    case 'disadvantaged':
      return 'Disadvantaged';
    case 'neutral':
      return 'Neutral';
  }
}

// --- Generic preview (no nonce or pre-battle) ---

function GenericPreview({ addr1, addr2 }: { readonly addr1: string; readonly addr2: string }) {
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
    }}>
      <div style={{
        display: 'flex',
        fontSize: 28,
        color: '#9ca3af',
        marginBottom: 24,
      }}>
        {'\u0045\u0074\u0068\u00B7\u0052\u0050\u0047 \u2014 Wallet Battle'}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 40,
      }}>
        <div style={{
          display: 'flex',
          fontSize: 20,
          color: '#e8e8ed',
          fontFamily: 'monospace',
        }}>
          {shortenAddress(addr1)}
        </div>
        <div style={{
          display: 'flex',
          fontSize: 56,
          fontWeight: 900,
          color: '#f4c430',
        }}>
          VS
        </div>
        <div style={{
          display: 'flex',
          fontSize: 20,
          color: '#e8e8ed',
          fontFamily: 'monospace',
        }}>
          {shortenAddress(addr2)}
        </div>
      </div>
      <div style={{
        display: 'flex',
        fontSize: 18,
        color: '#6b7280',
        marginTop: 24,
      }}>
        Who will win? Find out on Eth\u00B7RPG!
      </div>
    </div>
  );
}

// --- Fighter panel ---

interface FighterPanelProps {
  readonly fighter: BattleFighter;
  readonly isWinner: boolean;
}

function FighterPanel({ fighter, isWinner }: FighterPanelProps) {
  const theme = CLASS_THEMES[fighter.class.id as CharacterClassId];
  const displayName = getDisplayName(fighter);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      padding: 20,
    }}>
      {/* Class icon */}
      <div style={{
        display: 'flex',
        fontSize: 56,
        marginBottom: 8,
      }}>
        {theme.icon}
      </div>

      {/* Class name */}
      <div style={{
        display: 'flex',
        fontSize: 24,
        fontWeight: 700,
        color: theme.primary,
        marginBottom: 4,
      }}>
        {fighter.class.name}
      </div>

      {/* Display name */}
      <div style={{
        display: 'flex',
        fontSize: 16,
        color: '#9ca3af',
        marginBottom: 8,
        maxWidth: 280,
        textAlign: 'center' as const,
        justifyContent: 'center',
      }}>
        {displayName}
      </div>

      {/* Level */}
      <div style={{
        display: 'flex',
        fontSize: 16,
        color: '#e8e8ed',
        marginBottom: 8,
      }}>
        {`Lv. ${fighter.stats.level}`}
      </div>

      {/* Power */}
      <div style={{
        display: 'flex',
        fontSize: 32,
        fontWeight: 900,
        color: isWinner ? '#f4c430' : '#6b7280',
      }}>
        {fighter.stats.power.toLocaleString()}
      </div>

      {/* Winner indicator */}
      {isWinner && (
        <div style={{
          display: 'flex',
          fontSize: 14,
          fontWeight: 700,
          color: '#f4c430',
          marginTop: 4,
          textTransform: 'uppercase' as const,
          letterSpacing: 2,
        }}>
          WINNER
        </div>
      )}
    </div>
  );
}

// --- Battle result OG image ---

function BattleOGImage({ result }: { readonly result: BattleResult }) {
  const [fighter0, fighter1] = result.fighters;
  const winnerFighter = result.fighters[result.winner];
  const winnerTheme = CLASS_THEMES[winnerFighter.class.id as CharacterClassId];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      background: '#0a0a0f',
      position: 'relative',
    }}>
      {/* Top bar: title */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 20,
        paddingBottom: 8,
      }}>
        <div style={{
          display: 'flex',
          fontSize: 20,
          color: '#6b7280',
        }}>
          {`Eth\u00B7RPG \u2014 Wallet Battle`}
        </div>
      </div>

      {/* Main area: fighter panels + VS */}
      <div style={{
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 20,
        paddingRight: 20,
      }}>
        {/* Left fighter */}
        <FighterPanel
          fighter={fighter0}
          isWinner={result.winner === 0}
        />

        {/* VS + matchup center */}
        <div style={{
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          width: 200,
        }}>
          <div style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 900,
            color: '#f4c430',
            marginBottom: 8,
          }}>
            VS
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: 2,
          }}>
            <div style={{
              display: 'flex',
              fontSize: 12,
              color: '#9ca3af',
            }}>
              {`${getMatchupLabel(result.matchup.fighter0Advantage)} / ${getMatchupLabel(result.matchup.fighter1Advantage)}`}
            </div>
            <div style={{
              display: 'flex',
              fontSize: 12,
              color: '#6b7280',
            }}>
              {`${result.totalTurns} turns`}
            </div>
          </div>
        </div>

        {/* Right fighter */}
        <FighterPanel
          fighter={fighter1}
          isWinner={result.winner === 1}
        />
      </div>

      {/* Bottom banner: winner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(244, 196, 48, 0.08)',
        borderTop: '1px solid rgba(244, 196, 48, 0.2)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            display: 'flex',
            fontSize: 20,
          }}>
            {winnerTheme.icon}
          </div>
          <div style={{
            display: 'flex',
            fontSize: 18,
            fontWeight: 700,
            color: '#f4c430',
          }}>
            {`${getDisplayName(winnerFighter)} wins!`}
          </div>
          <div style={{
            display: 'flex',
            fontSize: 14,
            color: '#9ca3af',
          }}>
            {`${winnerFighter.class.name} \u2014 ${result.winnerHpPercent}% HP remaining`}
          </div>
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

  // Validate both addresses
  if (!isValidInput(addr1) || !isValidInput(addr2)) {
    return new ImageResponse(
      <GenericPreview addr1={addr1} addr2={addr2} />,
      { width: CARD_WIDTH, height: CARD_HEIGHT, status: 400, headers: ERROR_CACHE_HEADERS },
    );
  }

  // No nonce: generic preview
  if (!nonce) {
    return new ImageResponse(
      <GenericPreview addr1={addr1} addr2={addr2} />,
      { width: CARD_WIDTH, height: CARD_HEIGHT, headers: ERROR_CACHE_HEADERS },
    );
  }

  try {
    // Check battle cache first
    const cached = getCachedBattle(addr1, addr2, nonce);
    if (cached) {
      return new ImageResponse(
        <BattleOGImage result={cached.result} />,
        { width: CARD_WIDTH, height: CARD_HEIGHT, headers: SUCCESS_CACHE_HEADERS },
      );
    }

    // No cache hit: generate characters and simulate
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
      <BattleOGImage result={result} />,
      { width: CARD_WIDTH, height: CARD_HEIGHT, headers: SUCCESS_CACHE_HEADERS },
    );
  } catch {
    return new ImageResponse(
      <GenericPreview addr1={addr1} addr2={addr2} />,
      { width: CARD_WIDTH, height: CARD_HEIGHT, headers: ERROR_CACHE_HEADERS },
    );
  }
}
