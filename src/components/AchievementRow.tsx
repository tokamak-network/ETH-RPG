import type { Achievement } from '@/lib/types';
import AchievementBadge from './AchievementBadge';

const DEFAULT_MAX_DISPLAY = 6;

interface AchievementRowProps {
  readonly achievements: readonly Achievement[];
  readonly maxDisplay?: number;
}

export default function AchievementRow({
  achievements,
  maxDisplay = DEFAULT_MAX_DISPLAY,
}: AchievementRowProps) {
  if (achievements.length === 0) {
    return null;
  }

  const visible = achievements.slice(0, maxDisplay);
  const overflowCount = achievements.length - maxDisplay;

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {visible.map((achievement) => (
        <AchievementBadge key={achievement.id} achievement={achievement} size="sm" />
      ))}
      {overflowCount > 0 && (
        <span
          className="text-xs font-mono text-text-muted"
          title={`${overflowCount} more achievement${overflowCount === 1 ? '' : 's'}`}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
}
