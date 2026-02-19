import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ErrorBoundary from '@/components/ErrorBoundary';
import FeedbackButton from '@/components/FeedbackButton';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Eth\u00B7RPG \u2014 What hero is your wallet?',
    template: '%s | Eth\u00B7RPG',
  },
  description:
    'Enter an Ethereum wallet address to analyze on-chain transactions and generate an RPG character card. Stats, class, and AI hero lore included.',
  openGraph: {
    type: 'website',
    siteName: 'Eth\u00B7RPG',
    title: 'Eth\u00B7RPG \u2014 What hero is your wallet?',
    description:
      'Enter an Ethereum wallet address to analyze on-chain transactions and generate an RPG character card.',
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eth\u00B7RPG',
    description: 'What hero is your wallet?',
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
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <FeedbackButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
