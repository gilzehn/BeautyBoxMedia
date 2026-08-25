'use client';

// The console moved to /bizconsole; this stub keeps old bookmarks working.
// Delete this folder once everyone has updated their links.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BizManageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/bizconsole');
  }, [router]);
  return (
    <main style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
      <p>
        The console has moved to <Link href="/bizconsole">/bizconsole</Link>.
      </p>
    </main>
  );
}
