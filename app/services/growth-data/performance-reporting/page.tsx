import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function PerformanceReporting() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Growth &middot; Performance Optimization &amp; Reporting</span>
          <h1 className={styles.title}>
            Performance Optimization &amp; <span className="accent-text">Reporting.</span>
          </h1>
          <p className={styles.intro}>
            <em>Transparent, actionable insights that drive smarter decisions.</em>
          </p>
          <p className={styles.subtitle}>We monitor KPIs across all channels, run continuous optimization cycles, and deliver clear reporting so you always know what&apos;s working and why. Our dashboards cut through vanity metrics to surface the numbers that actually drive business decisions — giving your leadership team the confidence to double down on what&apos;s working and cut what isn&apos;t.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>Cross-channel KPI monitoring</li>
                  <li>Continuous optimization cycles</li>
                  <li>Custom executive dashboards</li>
                  <li>Weekly performance summaries</li>
                  <li>Monthly strategic reviews</li>
                  <li>Actionable insight reports (not vanity metrics)</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>Leadership teams who need clear, honest reporting that drives confident budget decisions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Unlock Your Data?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s turn your data into your competitive advantage.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
