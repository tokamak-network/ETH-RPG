import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-atmosphere px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">{'\u{1F6E1}\uFE0F'}</div>
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: 'var(--color-accent-gold)', fontFamily: 'var(--font-display)' }}
        >
          404
        </h1>
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Lost in the Dungeon
        </h2>
        <p
          className="mb-8 text-base"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          The path you seek does not exist in this realm. Return to the entrance and try again.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:brightness-110"
          style={{
            backgroundColor: 'var(--color-accent-gold)',
            color: '#000',
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
