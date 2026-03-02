import type { Metadata } from 'next';
import { Cinzel, Inter, Noto_Sans_KR, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ErrorBoundary from '@/components/ErrorBoundary';
import FeedbackButton from '@/components/FeedbackButton';
import SoundToggle from '@/components/SoundToggle';
import { SoundProvider } from '@/contexts/SoundContext';
import { COPY } from '@/lib/experiment-copy';
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
    default: COPY.metaTitle,
    template: '%s | Eth\u00B7RPG',
  },
  description: COPY.metaDescription,
  openGraph: {
    type: 'website',
    siteName: 'Eth\u00B7RPG',
    title: COPY.ogTitle,
    description: COPY.ogDescription,
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eth\u00B7RPG',
    description: COPY.metaTwitterDescription,
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
