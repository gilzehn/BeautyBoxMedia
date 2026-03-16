import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function PaidSearch() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C &middot; Paid Search &amp; Social Campaign Management</span>
          <h1 className={styles.title}>
            Paid Search &amp; Social Campaign <span className="accent-text">Management.</span>
          </h1>
          <p className={styles.intro}>
            <em>Google Ads done right is one of the highest-ROI channels available to beauty and fashion brands.</em>
          </p>
          <p className={styles.subtitle}>BEAUTYBOXMEDIA manages the full Google paid media stack: Search campaigns capturing high-intent shoppers at the moment of decision, Shopping and Performance Max campaigns built to outperform category benchmarks, and YouTube ads that reach beauty audiences while brand preferences are still forming. Every campaign is measured against MER and LTV — not just clicks and impressions — because CMOs and CFOs need to understand what the spend is actually building. You&apos;ll always know exactly where your budget is going and exactly what it&apos;s returning.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>Google Search campaign management</li>
                  <li>Shopping &amp; Performance Max campaigns</li>
                  <li>YouTube advertising</li>
                  <li>MER &amp; LTV-based measurement</li>
                  <li>Weekly budget &amp; performance reporting</li>
                  <li>Continuous bid &amp; audience optimization</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>CMOs and CFOs who need transparent, ROI-focused paid media management.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className={styles.ctaTitle}>Ready to Scale Your D2C Brand?</h2>
          <p className={styles.ctaSubtitle}>Let&apos;s build a growth strategy that compounds.</p>
          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '16px 40px' }}>
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
