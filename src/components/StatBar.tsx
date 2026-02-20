'use client';

interface StatBarProps {
  readonly label: string;
  readonly value: number;
  readonly maxValue: number;
  readonly color: string;
}

export default function StatBar({ label, value, maxValue, color }: StatBarProps) {
  const safeValue = value ?? 0;
  const fillPercent = Math.min(100, (safeValue / maxValue) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-xs font-mono text-text-secondary shrink-0 text-right">
        {label}
      </span>
      <div className="flex-1 h-3 rounded-full bg-bg-tertiary overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={safeValue}
          aria-valuemin={0}
          aria-valuemax={maxValue}
          aria-label={`${label} ${safeValue} out of ${maxValue}`}
          className="h-full rounded-full stat-bar-fill"
          style={{
            '--fill-width': `${fillPercent}%`,
            backgroundColor: color,
          } as React.CSSProperties}
        />
      </div>
      <span className="w-16 text-xs font-mono shrink-0 text-right">
        <span className="text-white">{safeValue}</span>
        <span className="text-text-muted">/{maxValue}</span>
      </span>
    </div>
  );
}
