import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// The dashboard is deliberately reachable without the console sign-in so it can
// be opened in a meeting or sent as a link. It still carries confidential deal
// material, so keep it out of search indexes.
export const metadata: Metadata = {
  title: 'Perfect Image LLC — Amazon channel diligence',
  description:
    'Buy-side diligence on the Amazon channel: sales and organic split, product breakdown, enforcement removals, forward exposure and inventory evidence.',
  robots: { index: false, follow: false, nocache: true },
};

export default function PerfectImageLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
