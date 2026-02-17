'use client';

interface StatBarProps {
  readonly label: string;
  readonly value: number;
  readonly maxValue: number;
  readonly color: string;
}

export default function StatBar({ label, value, maxValue, color }: StatBarProps) {
  const fillPercent = Math.min(100, (value / maxValue) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-xs font-mono text-text-secondary shrink-0 text-right">
        {label}
      </span>
      <div className="flex-1 h-3 rounded-full bg-bg-tertiary overflow-hidden">
        <div
          className="h-full rounded-full stat-bar-fill"
          style={{
            '--fill-width': `${fillPercent}%`,
            backgroundColor: color,
          } as React.CSSProperties}
        />
      </div>
      <span className="w-12 text-xs font-mono text-white shrink-0 text-right">
        {value}
      </span>
    </div>
  );
}
