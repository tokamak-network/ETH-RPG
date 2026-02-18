// Dynamic metadata for social media OG previews on result pages
import type { Metadata } from 'next';
import { getCached } from '@/lib/cache';

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ENS_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.eth$/;

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const rawAddress = decodeURIComponent((await params).address).toLowerCase();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  // Validate: must be ETH address or ENS name
  if (!ETH_ADDRESS_REGEX.test(rawAddress) && !ENS_REGEX.test(rawAddress)) {
    return {
      title: 'Eth\u00B7RPG \u2014 당신의 지갑은 어떤 영웅입니까?',
    };
  }

  const data = getCached(rawAddress);

  if (!data) {
    // Data not yet cached — show generic metadata with address hint
    const encodedAddress = encodeURIComponent(rawAddress);
    const label = ETH_ADDRESS_REGEX.test(rawAddress) ? shortenAddress(rawAddress) : rawAddress;
    return {
      title: `${label}의 캐릭터 카드 | Eth\u00B7RPG`,
      description: '이더리움 지갑 주소를 분석해 RPG 캐릭터 카드를 생성합니다.',
      openGraph: {
        title: `${label}의 캐릭터 카드`,
        description: '나의 온체인 영웅을 확인하세요!',
        images: [`${siteUrl}/api/og/${encodedAddress}`],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${label}의 캐릭터 카드 | Eth\u00B7RPG`,
        images: [`${siteUrl}/api/og/${encodedAddress}`],
      },
    };
  }

  // Personalized metadata from cached data — use resolved 0x address for OG images
  const displayName = data.ensName ?? shortenAddress(data.address);
  const title = `${displayName} — ${data.class.name} Lv.${data.stats.level}`;
  const MAX_LORE_LENGTH = 155;
  const loreSnippet = data.lore.length > MAX_LORE_LENGTH
    ? `${data.lore.slice(0, MAX_LORE_LENGTH)}...`
    : data.lore;
  const description = `전투력 ${data.stats.power.toLocaleString()} | ${loreSnippet}`;
  const ogAddress = encodeURIComponent(data.address);

  return {
    title,
    description,
    openGraph: {
      title,
      description: `${data.class.name} | 전투력 ${data.stats.power.toLocaleString()}`,
      images: [
        {
          url: `${siteUrl}/api/og/${ogAddress}`,
          width: 1200,
          height: 630,
          alt: `${displayName}의 Eth·RPG 캐릭터 카드`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} — ${data.class.name} Lv.${data.stats.level} | Eth\u00B7RPG`,
      description: `전투력 ${data.stats.power.toLocaleString()} | ${loreSnippet}`,
      images: [`${siteUrl}/api/og/${ogAddress}`],
    },
  };
}

export default function ResultLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
