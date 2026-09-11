import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Shared with the brand as a link rather than an attachment, but it carries
// account-level performance figures, so keep it out of search indexes.
export const metadata: Metadata = {
  title: 'govino: January to August 2026 performance | Beauty Box Media',
  description:
    'govino on Amazon, January to August 2026: revenue, advertising, branded versus generic search, and what we recommend for Q4.',
  robots: { index: false, follow: false, nocache: true },
};

export default function GovinoReportLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
