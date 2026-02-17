import type { Metadata } from 'next';
import ErrorBoundary from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Eth\u00B7RPG \u2014 당신의 지갑은 어떤 영웅입니까?',
    template: '%s | Eth\u00B7RPG',
  },
  description:
    '이더리움 지갑 주소를 입력하면 온체인 트랜잭션을 분석해 RPG 캐릭터 카드를 생성합니다. 스탯, 직업, AI 영웅 서사까지.',
  openGraph: {
    type: 'website',
    siteName: 'Eth\u00B7RPG',
    title: 'Eth\u00B7RPG \u2014 당신의 지갑은 어떤 영웅입니까?',
    description:
      '이더리움 지갑 주소를 입력하면 온체인 트랜잭션을 분석해 RPG 캐릭터 카드를 생성합니다.',
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eth\u00B7RPG',
    description: '당신의 지갑은 어떤 영웅입니까?',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
