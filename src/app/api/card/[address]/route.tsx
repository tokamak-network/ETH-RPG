// GET /api/card/[address] — Share card image (1080x1350)
import { ImageResponse } from 'next/og';
import { getCached } from '@/lib/cache';
import { getSpriteSrc } from '@/lib/sprite-data';
import { shortenAddress } from '@/lib/format-utils';
import { CLASS_THEMES, STAT_MAX_VALUES, STAT_COLORS, TIER_BORDER_COLORS, getPowerTier } from '@/styles/themes';
import { CLASS_SKILLS } from '@/lib/skills';
import type { CharacterClassId, Achievement } from '@/lib/types';

const CARD_BADGE_SIZE = 32;
const CARD_MAX_BADGES = 6;

export const dynamic = 'force-dynamic';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const SUCCESS_CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' };
const ERROR_CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

interface StatBarCardProps {
  readonly label: string;
  readonly value: number;
  readonly maxValue: number;
  readonly color: string;
}

function StatBarCard({ label, value, maxValue, color }: StatBarCardProps) {
  const safeValue = value ?? 0;
  const percentage = Math.min(100, (safeValue / maxValue) * 100);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: 16,
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        width: 60,
        fontSize: 18,
        color: '#9ca3af',
        fontWeight: 700,
        fontFamily: 'monospace',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        flex: 1,
        height: 20,
        borderRadius: 10,
        background: '#1a1a2e',
        overflow: 'hidden',
        marginLeft: 12,
        marginRight: 12,
      }}>
        <div style={{
          display: 'flex',
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: 10,
        }} />
      </div>
      <div style={{
        display: 'flex',
        width: 90,
        fontSize: 16,
        textAlign: 'right' as const,
        fontWeight: 600,
        justifyContent: 'flex-end',
      }}>
        <span style={{ display: 'flex', color: '#e8e8ed' }}>{safeValue}</span>
        <span style={{ display: 'flex', color: '#6b7280' }}>/{maxValue}</span>
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
        {'\u0045\u0074\u0068\u00B7\u0052\u0050\u0047'}
      </div>
      <div style={{
        display: 'flex',
        fontSize: 22,
        color: '#9ca3af',
        textAlign: 'center' as const,
        padding: '0 60px',
      }}>
        {'Please generate a character'}
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
): Promise<ImageResponse> {
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
    const data = await getCached(address);

    if (!data) {
      return new ImageResponse(<ErrorCard />, {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        headers: ERROR_CACHE_HEADERS,
      });
    }

    const theme = CLASS_THEMES[data.class.id as CharacterClassId];
    const tier = getPowerTier(data.stats.power);
    const skill = CLASS_SKILLS[data.class.id as CharacterClassId];
    const shortAddr = shortenAddress(data.address);
    const displayName = data.ensName ?? shortAddr;
    const spriteSrc = getSpriteSrc(data.class.id as CharacterClassId, data.stats.level);

    return new ImageResponse(
      (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0f',
          border: `2px solid ${tier.frameColor}`,
          borderRadius: 16,
          padding: 60,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 32,
          }}>
            {spriteSrc ? (
              <img src={spriteSrc} width={120} height={120} style={{ imageRendering: 'pixelated' as const, marginBottom: 12 }} />
            ) : (
              <div style={{
                display: 'flex',
                fontSize: 80,
                marginBottom: 12,
              }}>
                {theme.icon}
              </div>
            )}
            <div style={{
              display: 'flex',
              fontSize: 44,
              color: theme.primary,
              fontWeight: 900,
              marginBottom: 8,
            }}>
              {data.class.name}
            </div>
            <div style={{
              display: 'flex',
              fontSize: 24,
              color: '#9ca3af',
            }}>
              {`Lv. ${data.stats.level} | ${displayName}`}
            </div>
          </div>

          <div style={{
            display: 'flex',
            width: '100%',
            height: 1,
            background: '#2a2a3e',
            marginBottom: 32,
          }} />

          {data.achievements && data.achievements.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 32,
              width: '100%',
            }}>
              {(data.achievements as readonly Achievement[]).slice(0, CARD_MAX_BADGES).map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: CARD_BADGE_SIZE,
                    height: CARD_BADGE_SIZE,
                    borderRadius: '50%',
                    border: `2px solid ${TIER_BORDER_COLORS[a.tier]}`,
                    backgroundColor: 'rgba(10, 10, 15, 0.8)',
                    fontSize: 16,
                  }}
                >
                  {a.icon}
                </div>
              ))}
            </div>
          )}

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
            <StatBarCard label="DEX" value={data.stats.dex} maxValue={STAT_MAX_VALUES.dex} color={STAT_COLORS.dex} />
            <StatBarCard label="LUCK" value={data.stats.luck} maxValue={STAT_MAX_VALUES.luck} color={STAT_COLORS.luck} />
          </div>

          <div style={{
            display: 'flex',
            width: '100%',
            height: 1,
            background: '#2a2a3e',
            marginBottom: 32,
          }} />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 32,
          }}>
            <div style={{
              display: 'flex',
              fontSize: 16,
              fontWeight: 700,
              color: tier.frameColor,
              letterSpacing: 2,
              marginBottom: 4,
            }}>
              {tier.label}
            </div>
            <div style={{
              display: 'flex',
              fontSize: 20,
              color: '#9ca3af',
              marginBottom: 8,
            }}>
              {'Power'}
            </div>
            <div style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 900,
              color: '#f4c430',
            }}>
              {data.stats.power.toLocaleString()}
            </div>
          </div>

          <div style={{
            display: 'flex',
            width: '100%',
            height: 1,
            background: '#2a2a3e',
            marginBottom: 32,
          }} />

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 24,
            padding: '0 20px',
          }}>
            <div style={{
              display: 'flex',
              fontSize: 22,
              color: '#e8e8ed',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}>
              {data.lore}
            </div>
          </div>

          {/* Skill pill */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 32,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 20px',
              borderRadius: 20,
              backgroundColor: `${theme.primary}20`,
              border: `1px solid ${theme.primary}40`,
            }}>
              <div style={{
                display: 'flex',
                fontSize: 18,
                fontWeight: 700,
                color: theme.primary,
              }}>
                {skill.name}
              </div>
              <div style={{
                display: 'flex',
                fontSize: 14,
                color: '#9ca3af',
              }}>
                {`${skill.mpCost} MP`}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex' }} />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{
              display: 'flex',
              fontSize: 16,
              color: '#6b7280',
              marginBottom: 4,
            }}>
              {shortAddr}
            </div>
            <div style={{
              display: 'flex',
              fontSize: 18,
              color: '#4a9eff',
              fontWeight: 600,
            }}>
              {`Eth\u00B7RPG`}
            </div>
          </div>
        </div>
      ),
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
