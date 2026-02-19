'use client';

interface LoadingScreenProps {
  readonly step: string;
}

const PROGRESS_STEPS: readonly string[] = [
  'Analyzing transactions...',
  'Calculating stats...',
  'Determining class...',
  'Writing hero lore...',
] as const;

function getActiveStepIndex(step: string): number {
  const index = PROGRESS_STEPS.indexOf(step);
  return index === -1 ? 0 : index;
}

export default function LoadingScreen({ step }: LoadingScreenProps) {
  const activeIndex = getActiveStepIndex(step);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      <span className="text-6xl loading-pulse" aria-hidden="true">
        &#x2694;&#xFE0F;
      </span>

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-semibold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
          Summoning hero...
        </h2>
        <p className="text-sm text-text-secondary">
          {step}
        </p>
      </div>

      <div className="flex items-center gap-4 sm:gap-3">
        {PROGRESS_STEPS.map((progressStep, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <div
              key={progressStep}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-accent-gold'
                    : isActive
                      ? 'bg-accent-gold loading-pulse'
                      : 'bg-bg-tertiary'
                }`}
              />
              <span
                className={`text-[10px] whitespace-nowrap transition-colors duration-300 hidden sm:block ${
                  isCompleted || isActive ? 'text-text-secondary' : 'text-text-muted'
                }`}
              >
                {progressStep}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
