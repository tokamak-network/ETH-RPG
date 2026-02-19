import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ addr1: string; addr2: string }>;
}): Promise<Metadata> {
  const { addr1, addr2 } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    title: `Wallet Battle \u2014 Eth\u00B7RPG`,
    description: `Watch the epic battle between two Ethereum wallets.`,
    openGraph: {
      title: `Wallet Battle \u2014 Eth\u00B7RPG`,
      description: `Who will win? Find out on Eth\u00B7RPG!`,
      images: [`${siteUrl}/api/og/battle/${addr1}/${addr2}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Wallet Battle \u2014 Eth\u00B7RPG`,
      images: [`${siteUrl}/api/og/battle/${addr1}/${addr2}`],
    },
  };
}

export default function BattleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
