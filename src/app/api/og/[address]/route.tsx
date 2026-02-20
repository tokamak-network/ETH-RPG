// GET /api/og/[address] — Dynamic OG image (1200x630)
import { ImageResponse } from 'next/og';
import { getCached } from '@/lib/cache';
import { getSpriteSrc } from '@/lib/sprite-data';
import { shortenAddress } from '@/lib/format-utils';
import { CLASS_THEMES, STAT_MAX_VALUES, STAT_COLORS, TIER_BORDER_COLORS, getPowerTier } from '@/styles/themes';
import { CLASS_SKILLS } from '@/lib/skills';
import { incrementCounter } from '@/lib/metrics';
import type { CharacterClassId, Achievement } from '@/lib/types';

const OG_BADGE_SIZE = 28;
const OG_MAX_BADGES = 6;

export const dynamic = 'force-dynamic';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const SUCCESS_CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' };
const ERROR_CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

interface StatBarOGProps {
  readonly label: string;
  readonly value: number;
  readonly maxValue: number;
  readonly color: string;
}

function StatBarOG({ label, value, maxValue, color }: StatBarOGProps) {
  const safeValue = value ?? 0;
  const percentage = Math.min(100, (safeValue / maxValue) * 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
      <div style={{
        display: 'flex',
        width: 50,
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: 600,
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
        width: 70,
        fontSize: 12,
        textAlign: 'right' as const,
        justifyContent: 'flex-end',
      }}>
        <span style={{ display: 'flex', color: '#e8e8ed' }}>{safeValue}</span>
        <span style={{ display: 'flex', color: '#6b7280' }}>/{maxValue}</span>
      </div>
    </div>
  );
}

function DefaultOG() {
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
        fontSize: 48,
        fontWeight: 900,
        color: '#f4c430',
        marginBottom: 16,
      }}>
        {'\u0045\u0074\u0068\u00B7\u0052\u0050\u0047'}
      </div>
      <div style={{ display: 'flex', fontSize: 24, color: '#9ca3af' }}>
        {'What hero is your wallet?'}
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
    return new ImageResponse(<DefaultOG />, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      status: 400,
      headers: ERROR_CACHE_HEADERS,
    });
  }

  try {
    const data = await getCached(address);

    if (!data) {
      return new ImageResponse(<DefaultOG />, {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        headers: ERROR_CACHE_HEADERS,
      });
    }

    incrementCounter('og_image_load').catch(() => {});
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
          background: '#0a0a0f',
          border: `2px solid ${tier.frameColor}`,
          padding: 40,
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingRight: 40,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 4,
            }}>
              {spriteSrc ? (
                <img src={spriteSrc} width={56} height={56} style={{ imageRendering: 'pixelated' as const }} />
              ) : (
                <div style={{ display: 'flex', fontSize: 40 }}>{theme.icon}</div>
              )}
              <div style={{
                display: 'flex',
                fontSize: 40,
                color: theme.primary,
                fontWeight: 700,
              }}>
                {data.class.name}
              </div>
            </div>
            <div style={{
              display: 'flex',
              fontSize: 22,
              color: '#9ca3af',
              marginBottom: 12,
            }}>
              {`Lv. ${data.stats.level} | ${displayName}`}
            </div>
            {data.achievements && data.achievements.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 6,
                marginBottom: 12,
              }}>
                {(data.achievements as readonly Achievement[]).slice(0, OG_MAX_BADGES).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: OG_BADGE_SIZE,
                      height: OG_BADGE_SIZE,
                      borderRadius: '50%',
                      border: `2px solid ${TIER_BORDER_COLORS[a.tier]}`,
                      backgroundColor: 'rgba(10, 10, 15, 0.8)',
                      fontSize: 14,
                    }}
                  >
                    {a.icon}
                  </div>
                ))}
              </div>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
            }}>
              <div style={{
                display: 'flex',
                fontSize: 56,
                color: '#f4c430',
                fontWeight: 900,
              }}>
                {data.stats.power.toLocaleString()}
              </div>
              <div style={{
                display: 'flex',
                fontSize: 16,
                fontWeight: 700,
                color: tier.frameColor,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}>
                {tier.label}
              </div>
            </div>
            <div style={{
              display: 'flex',
              fontSize: 18,
              color: '#e8e8ed',
              fontStyle: 'italic',
              lineHeight: 1.5,
              marginBottom: 12,
            }}>
              {data.lore}
            </div>
            <div style={{
              display: 'flex',
              fontSize: 14,
              color: theme.primary,
              fontWeight: 600,
            }}>
              {`${skill.name} \u2022 ${skill.mpCost} MP`}
            </div>
          </div>

          <div style={{
            width: 360,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <StatBarOG label="HP" value={data.stats.hp} maxValue={STAT_MAX_VALUES.hp} color={STAT_COLORS.hp} />
            <StatBarOG label="MP" value={data.stats.mp} maxValue={STAT_MAX_VALUES.mp} color={STAT_COLORS.mp} />
            <StatBarOG label="STR" value={data.stats.str} maxValue={STAT_MAX_VALUES.str} color={STAT_COLORS.str} />
            <StatBarOG label="INT" value={data.stats.int} maxValue={STAT_MAX_VALUES.int} color={STAT_COLORS.int} />
            <StatBarOG label="DEX" value={data.stats.dex} maxValue={STAT_MAX_VALUES.dex} color={STAT_COLORS.dex} />
            <StatBarOG label="LUCK" value={data.stats.luck} maxValue={STAT_MAX_VALUES.luck} color={STAT_COLORS.luck} />
          </div>

          <div style={{
            display: 'flex',
            position: 'absolute',
            bottom: 20,
            right: 40,
            fontSize: 16,
            color: '#6b7280',
          }}>
            {`Eth\u00B7RPG`}
          </div>
        </div>
      ),
      { width: CARD_WIDTH, height: CARD_HEIGHT, headers: SUCCESS_CACHE_HEADERS },
    );
  } catch {
    return new ImageResponse(<DefaultOG />, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      headers: ERROR_CACHE_HEADERS,
    });
  }
}
