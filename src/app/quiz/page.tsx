import type { Metadata } from 'next';
import TrustBanner from '@/components/TrustBanner';
import QuizFlow from '@/components/quiz/QuizFlow';

export const metadata: Metadata = {
  title: 'On-Chain Personality Test',
  description: 'Answer 5 questions to predict your Ethereum class. No wallet needed — discover if you\'re a Rogue, Guardian, Elder Wizard, or something else.',
  openGraph: {
    title: 'Eth\u00B7RPG \u2014 On-Chain Personality Test',
    description: 'What\u2019s your on-chain class? Take the quiz to find out.',
    images: ['/api/og/default'],
  },
};

export default function QuizPage() {
  return (
    <div className="min-h-screen flex flex-col bg-atmosphere">
      <TrustBanner />
      <main id="main-content" className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <QuizFlow />
      </main>
    </div>
  );
}
