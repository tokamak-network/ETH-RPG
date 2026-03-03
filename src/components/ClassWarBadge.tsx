'use client';

/**
 * Small badge indicating a class has the active Class War damage buff.
 * Displayed next to class name on result page and battle arena.
 */
export default function ClassWarBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
      style={{
        color: '#f4c430',
        backgroundColor: 'rgba(244, 196, 48, 0.1)',
        border: '1px solid rgba(244, 196, 48, 0.2)',
      }}
    >
      +5% DMG
    </span>
  );
}
