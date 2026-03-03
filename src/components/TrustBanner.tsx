export default function TrustBanner() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
        style={{
          backgroundColor: 'var(--color-accent-gold)',
          color: '#000',
        }}
      >
        Skip to content
      </a>
    <div
      className="sticky top-0 z-50 w-full border-b"
      style={{
        backgroundColor: 'rgba(18, 18, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-2 max-w-5xl mx-auto">
        {/* Left spacer */}
        <div />
        {/* Center: trust text */}
        <p className="text-sm text-text-secondary text-center">
          <span aria-hidden="true" className="mr-1">{'\u{1F6E1}\uFE0F'}</span>
          Address lookup only &middot; No wallet connection required
        </p>
        {/* Right: nav links */}
        <div className="hidden sm:flex items-center justify-end gap-4">
          <a
            href="/quiz"
            className="text-sm transition-colors hover:text-text-primary"
            style={{ color: 'var(--color-accent-gold)' }}
          >
            Quiz
          </a>
          <a
            href="/#classes"
            className="text-sm transition-colors hover:text-text-primary"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Classes
          </a>
          <a
            href="/ranking"
            className="text-sm transition-colors hover:text-text-primary"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Leaderboard
          </a>
          <a
            href="/#faq"
            className="text-sm transition-colors hover:text-text-primary"
            style={{ color: 'var(--color-text-muted)' }}
          >
            FAQ
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
