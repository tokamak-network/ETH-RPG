'use client';

export default function TrustBanner() {
  return (
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
        <p className="text-xs text-text-secondary text-center">
          <span aria-hidden="true" className="mr-1">{'\u{1F6E1}\uFE0F'}</span>
          Address lookup only &middot; No wallet connection required
        </p>
        {/* Right: nav links */}
        <div className="hidden sm:flex items-center justify-end gap-4">
          <a
            href="#classes"
            className="text-xs transition-colors hover:text-text-primary"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Classes
          </a>
          <a
            href="#faq"
            className="text-xs transition-colors hover:text-text-primary"
            style={{ color: 'var(--color-text-muted)' }}
          >
            FAQ
          </a>
        </div>
      </div>
    </div>
  );
}
