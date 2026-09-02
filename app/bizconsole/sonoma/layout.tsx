import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Shared with the brand as a link rather than an attachment, but it carries
// account-level performance figures, so keep it out of search indexes.
export const metadata: Metadata = {
  title: 'Sonoma Syrup Co: our 2026 investment vs. income | Beauty Box Media',
  description:
    'What our 2026 advertising investment in the Sonoma Syrup Co brand delivered on Amazon: income, units and month-by-month comparison against 2025.',
  robots: { index: false, follow: false, nocache: true },
};

export default function SonomaReportLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
