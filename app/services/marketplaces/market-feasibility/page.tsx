import Link from 'next/link';
import styles from '../page.module.css';

export default function MarketFeasibilityPage() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon &middot; Market Feasibility &amp; Strategic Research</span>
          <h1 className={styles.title}>
            Market Feasibility &amp; Strategic <span className="accent-text">Research.</span>
          </h1>
          <p className={styles.intro}>
            <em>Smart executives don&apos;t commit capital without data — and neither do we.</em>
          </p>
          <p className={styles.subtitle}>
            Before your brand takes a single step on Amazon, BEAUTYBOXMEDIA delivers a complete market feasibility study that maps the real opportunity in your category: demand size, competitive intensity, pricing benchmarks, and profit margins. We surface the gaps your competitors haven&apos;t found yet and the landmines they&apos;ve already stepped on. Whether you&apos;re a VP of Business Development evaluating Amazon as a new channel or a founder ready to scale, this research gives your team the clarity to move fast and invest smart. You&apos;ll receive a full visual PDF report with an executive summary and a clear, actionable launch roadmap your entire leadership team can align on.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>Category demand &amp; sizing analysis</li>
                  <li>Competitive landscape mapping</li>
                  <li>Pricing benchmark &amp; margin modeling</li>
                  <li>Gap &amp; opportunity identification</li>
                  <li>Visual PDF report with executive summary</li>
                  <li>Actionable launch roadmap</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>
                  VPs of Business Development, founders, and leadership teams evaluating Amazon as a growth channel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build your Amazon growth strategy.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
