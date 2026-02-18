// GET /api/card/[address] — Share card image (1080x1350)
import { ImageResponse } from 'next/og';
import * as Sentry from '@sentry/nextjs';
import { getCached } from '@/lib/cache';
import { generateCharacterData } from '@/lib/pipeline';
import { CLASS_THEMES, STAT_MAX_VALUES, STAT_COLORS } from '@/styles/themes';
import type { CharacterClassId, GenerateResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const SUCCESS_CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' };
const ERROR_CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface StatBarCardProps {
  readonly label: string;
  readonly value: number;
  readonly maxValue: number;
  readonly color: string;
}

function StatBarCard({ label, value, maxValue, color }: StatBarCardProps) {
  const percentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: 16,
      width: '100%',
    }}>
      <div style={{
        width: 60,
        fontSize: 18,
        color: '#9ca3af',
        fontWeight: 700,
        fontFamily: 'monospace',
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        height: 20,
        borderRadius: 10,
        background: '#1a1a2e',
        overflow: 'hidden',
        display: 'flex',
        marginLeft: 12,
        marginRight: 12,
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: 10,
        }} />
      </div>
      <div style={{
        width: 50,
        fontSize: 18,
        color: '#e8e8ed',
        textAlign: 'right' as const,
        fontWeight: 600,
      }}>
        {value}
      </div>
    </div>
  );
}

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
        fontSize: 64,
        marginBottom: 20,
      }}>
        {'\u2694\uFE0F'}
      </div>
      <div style={{
        fontSize: 36,
        fontWeight: 900,
        color: '#f4c430',
        marginBottom: 12,
      }}>
        {'Eth\u00B7RPG'}
      </div>
      <div style={{
        fontSize: 22,
        color: '#9ca3af',
        textAlign: 'center' as const,
        padding: '0 60px',
      }}>
        {'Please generate a character'}
      </div>
      <div style={{
        fontSize: 16,
        color: '#6b7280',
        marginTop: 16,
      }}>
        {'ethrpg.com'}
      </div>
    </div>
  );
}

async function resolveCharacterData(address: string): Promise<GenerateResponse | null> {
  // Try cache first
  const cached = getCached(address);
  if (cached) {
    return cached;
  }

  // Self-heal: regenerate data without AI lore (fast fallback templates)
  try {
    return await generateCharacterData(address, { skipAiLore: true });
  } catch (error) {
    Sentry.captureException(error, { level: 'warning', tags: { route: 'card-image' } });
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
): Promise<ImageResponse | Response> {
  const { address } = await params;

  if (!ETH_ADDRESS_REGEX.test(address)) {
    return new ImageResponse(<ErrorCard />, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      status: 400,
      headers: ERROR_CACHE_HEADERS,
    });
  }

  try {
    const data = await resolveCharacterData(address);

    if (!data) {
      return new ImageResponse(<ErrorCard />, {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        headers: ERROR_CACHE_HEADERS,
      });
    }

    const theme = CLASS_THEMES[data.class.id as CharacterClassId];
    const shortAddr = shortenAddress(data.address);
    const displayName = data.ensName ?? shortAddr;

    return new ImageResponse(
      (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0f',
          border: `2px solid ${theme.primary}`,
          borderRadius: 16,
          padding: 60,
        }}>
          {/* Top section: Class icon + name + level */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 32,
          }}>
            <div style={{
              fontSize: 80,
              marginBottom: 12,
              display: 'flex',
            }}>
              {theme.icon}
            </div>
            <div style={{
              fontSize: 44,
              color: theme.primary,
              fontWeight: 900,
              marginBottom: 8,
            }}>
              {data.class.name}
            </div>
            <div style={{
              fontSize: 24,
              color: '#9ca3af',
            }}>
              Lv. {data.stats.level} | {displayName}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            width: '100%',
            height: 1,
            background: '#2a2a3e',
            marginBottom: 32,
          }} />

          {/* Stats section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginBottom: 32,
          }}>
            <StatBarCard label="HP" value={data.stats.hp} maxValue={STAT_MAX_VALUES.hp} color={STAT_COLORS.hp} />
            <StatBarCard label="MP" value={data.stats.mp} maxValue={STAT_MAX_VALUES.mp} color={STAT_COLORS.mp} />
            <StatBarCard label="STR" value={data.stats.str} maxValue={STAT_MAX_VALUES.str} color={STAT_COLORS.str} />
            <StatBarCard label="INT" value={data.stats.int} maxValue={STAT_MAX_VALUES.int} color={STAT_COLORS.int} />
            <StatBarCard label="LUCK" value={data.stats.luck} maxValue={STAT_MAX_VALUES.luck} color={STAT_COLORS.luck} />
          </div>

          {/* Divider */}
          <div style={{
            width: '100%',
            height: 1,
            background: '#2a2a3e',
            marginBottom: 32,
          }} />

          {/* Power section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 32,
          }}>
            <div style={{
              fontSize: 20,
              color: '#9ca3af',
              marginBottom: 8,
            }}>
              Power
            </div>
            <div style={{
              fontSize: 72,
              fontWeight: 900,
              color: '#f4c430',
              display: 'flex',
            }}>
              {data.stats.power.toLocaleString()}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            width: '100%',
            height: 1,
            background: '#2a2a3e',
            marginBottom: 32,
          }} />

          {/* Lore section */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 40,
            padding: '0 20px',
          }}>
            <div style={{
              fontSize: 22,
              color: '#e8e8ed',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}>
              {data.lore}
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1, display: 'flex' }} />

          {/* Bottom branding */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{
              fontSize: 16,
              color: '#6b7280',
              marginBottom: 4,
            }}>
              {shortAddr}
            </div>
            <div style={{
              fontSize: 18,
              color: '#4a9eff',
              fontWeight: 600,
            }}>
              Eth·RPG
            </div>
          </div>
        </div>
      ),
      { width: CARD_WIDTH, height: CARD_HEIGHT, headers: SUCCESS_CACHE_HEADERS },
    );
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'card-image-render' } });
    return new ImageResponse(<ErrorCard />, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      headers: ERROR_CACHE_HEADERS,
    });
  }
}
