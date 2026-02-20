import type { Metadata } from 'next';
import { Cinzel, Inter, Noto_Sans_KR, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ErrorBoundary from '@/components/ErrorBoundary';
import FeedbackButton from '@/components/FeedbackButton';
import SoundToggle from '@/components/SoundToggle';
import { SoundProvider } from '@/contexts/SoundContext';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-kr',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

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
    <html lang="en" className={`${cinzel.variable} ${inter.variable} ${notoSansKR.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <SoundProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <SoundToggle />
          <FeedbackButton />
        </SoundProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
