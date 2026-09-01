import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Shared with the brand as a link rather than an attachment, but it carries
// account-level performance figures, so keep it out of search indexes.
export const metadata: Metadata = {
  title: 'Sonoma Syrup Co — 2026 ad spend vs. sales | Beauty Box Media',
  description:
    'How Sonoma Syrup Co advertising investment moved total brand sales on Amazon across January to August 2026, and how to read the relationship between the two.',
  robots: { index: false, follow: false, nocache: true },
};

export default function SonomaReportLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
