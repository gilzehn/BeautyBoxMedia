import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function EmailLifecycle() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>D2C &middot; Lifecycle &amp; Email Marketing</span>
          <h1 className={styles.title}>
            Lifecycle &amp; Email <span className="accent-text">Marketing.</span>
          </h1>
          <p className={styles.intro}>
            <em>The most profitable customer you can acquire is the one you already have.</em>
          </p>
          <p className={styles.subtitle}>BEAUTYBOXMEDIA builds intelligent email and SMS automation systems that recover abandoned carts, re-engage lapsed customers, educate post-purchase buyers, and execute high-revenue seasonal campaigns for moments like Black Friday, Mother&apos;s Day, and product launches. Deep segmentation by skin concern, purchase behavior, and product preference ensures every message feels personal — not broadcast. For CMOs focused on LTV and payback period, lifecycle marketing is consistently one of the highest-return investments in the entire marketing mix.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>Abandoned cart recovery flows</li>
                  <li>Post-purchase education sequences</li>
                  <li>Win-back &amp; re-engagement campaigns</li>
                  <li>Seasonal campaign execution (BFCM, Mother&apos;s Day, launches)</li>
                  <li>Deep segmentation by behavior &amp; preference</li>
                  <li>SMS &amp; email automation</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>CMOs focused on LTV and payback period who want to maximize revenue from existing customers.</p>
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
