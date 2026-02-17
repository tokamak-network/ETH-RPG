'use client';

export default function TrustBanner() {
  return (
    <div className="sticky top-0 z-50 w-full bg-bg-secondary border-b border-border">
      <p className="py-2 text-center text-xs text-text-secondary">
        <span aria-hidden="true" className="mr-1">&#x1F6E1;&#xFE0F;</span>
        주소만 조회 &middot; 키/서명/연결 없음
      </p>
    </div>
  );
}
