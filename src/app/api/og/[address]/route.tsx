// GET /api/og/[address] — Dynamic OG image (1200x630)
import { ImageResponse } from '@vercel/og';
import { getCached } from '@/lib/cache';
import { CLASS_THEMES } from '@/styles/themes';
import { STAT_MAX_VALUES, STAT_COLORS } from '@/styles/themes';
import type { CharacterClassId } from '@/lib/types';

export const runtime = 'edge';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface StatBarOGProps {
  readonly label: string;
  readonly value: number;
  readonly maxValue: number;
  readonly color: string;
}

function StatBarOG({ label, value, maxValue, color }: StatBarOGProps) {
  const percentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
      <div style={{
        width: 50,
        fontSize: 14,
        color: '#9ca3af',
        fontWeight: 600,
        fontFamily: 'monospace',
      }}>
        {label}
      </div>
      <div style={{
        flex: 1,
        height: 14,
        borderRadius: 7,
        background: '#1a1a2e',
        overflow: 'hidden',
        display: 'flex',
        marginLeft: 8,
        marginRight: 8,
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: 7,
        }} />
      </div>
      <div style={{
        width: 40,
        fontSize: 14,
        color: '#e8e8ed',
        textAlign: 'right' as const,
      }}>
        {value}
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
        fontSize: 48,
        fontWeight: 900,
        color: '#f4c430',
        marginBottom: 16,
      }}>
        {'Eth\u00B7RPG'}
      </div>
      <div style={{ fontSize: 24, color: '#9ca3af' }}>
        {'당신의 지갑은 어떤 영웅입니까?'}
      </div>
    </div>
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
): Promise<ImageResponse> {
  const { address } = await params;
  const data = getCached(address);

  if (!data) {
    return new ImageResponse(<DefaultOG />, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
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
        background: '#0a0a0f',
        padding: 40,
      }}>
        {/* Left side: Character info */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
          paddingRight: 40,
        }}>
          <div style={{
            fontSize: 40,
            color: theme.primary,
            fontWeight: 700,
            marginBottom: 4,
          }}>
            {theme.icon} {data.class.name}
          </div>
          <div style={{
            fontSize: 22,
            color: '#9ca3af',
            marginBottom: 20,
          }}>
            Lv. {data.stats.level} | {displayName}
          </div>
          <div style={{
            fontSize: 56,
            color: '#f4c430',
            fontWeight: 900,
            marginBottom: 20,
          }}>
            {'\u2694\uFE0F'} {data.stats.power.toLocaleString()}
          </div>
          <div style={{
            fontSize: 18,
            color: '#e8e8ed',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}>
            {`"${data.lore}"`}
          </div>
        </div>

        {/* Right side: Stat bars */}
        <div style={{
          width: 360,
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
        }}>
          <StatBarOG label="HP" value={data.stats.hp} maxValue={STAT_MAX_VALUES.hp} color={STAT_COLORS.hp} />
          <StatBarOG label="MP" value={data.stats.mp} maxValue={STAT_MAX_VALUES.mp} color={STAT_COLORS.mp} />
          <StatBarOG label="STR" value={data.stats.str} maxValue={STAT_MAX_VALUES.str} color={STAT_COLORS.str} />
          <StatBarOG label="INT" value={data.stats.int} maxValue={STAT_MAX_VALUES.int} color={STAT_COLORS.int} />
          <StatBarOG label="LUCK" value={data.stats.luck} maxValue={STAT_MAX_VALUES.luck} color={STAT_COLORS.luck} />
        </div>

        {/* Bottom branding */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 40,
          fontSize: 16,
          color: '#6b7280',
        }}>
          {'Eth\u00B7RPG'}
        </div>
      </div>
    ),
    { width: CARD_WIDTH, height: CARD_HEIGHT },
  );
}
