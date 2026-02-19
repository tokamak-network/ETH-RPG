import type { Achievement } from '@/lib/types';
import { TIER_BORDER_COLORS } from '@/styles/themes';

const SIZE_MAP = {
  sm: 24,
  md: 36,
  lg: 48,
} as const;

interface AchievementBadgeProps {
  readonly achievement: Achievement;
  readonly size?: 'sm' | 'md' | 'lg';
}

export default function AchievementBadge({ achievement, size = 'md' }: AchievementBadgeProps) {
  const px = SIZE_MAP[size];
  const borderColor = TIER_BORDER_COLORS[achievement.tier];
  const fontSize = size === 'sm' ? 12 : size === 'md' ? 18 : 24;

  return (
    <div
      title={`${achievement.name} — ${achievement.description}`}
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: px,
        height: px,
        border: `2px solid ${borderColor}`,
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
        fontSize,
        lineHeight: 1,
        cursor: 'default',
      }}
    >
      <span aria-hidden="true">{achievement.icon}</span>
    </div>
  );
}

