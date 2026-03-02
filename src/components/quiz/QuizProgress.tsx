'use client';

interface QuizProgressProps {
  readonly current: number;
  readonly total: number;
}

export default function QuizProgress({ current, total }: QuizProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
        <span>Question {current} of {total}</span>
        <span>{percentage}%</span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: 'var(--color-accent-gold)',
          }}
        />
      </div>
    </div>
  );
}
