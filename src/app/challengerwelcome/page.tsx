import { ChallengerWelcome } from './challenger-welcome';
import { SearchParams } from '@/constants/search-params';
import type { Metadata } from 'next';

export function generateMetadata({ searchParams }: any): Metadata {
  const wonTheChallenge =
    SearchParams.WonTheChallenge in searchParams &&
    searchParams[SearchParams.WonTheChallenge] === 'true';

  const metadata: Metadata = {
    openGraph: {
      images: {
        url:
          wonTheChallenge ?
            '/static/images/open-graph/won-challenge.png'
          : '/static/images/open-graph/thumbnail.png',
        height: wonTheChallenge ? 4320 : 1337,
        width: wonTheChallenge ? 4320 : 1337,
      },
    },
  };

  return metadata;
}

export default function Page() {
  return <ChallengerWelcome />;
}
