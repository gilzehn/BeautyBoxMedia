import Link from 'next/link';
import styles from '../page.module.css';

export default function AdvertisingPage() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon &middot; Advertising Management</span>
          <h1 className={styles.title}>
            Advertising <span className="accent-text">Management.</span>
          </h1>
          <p className={styles.intro}>
            <em>Amazon PPC without a strategy is the fastest way to waste your marketing budget.</em>
          </p>
          <p className={styles.subtitle}>
            BEAUTYBOXMEDIA builds structured, scalable advertising programs across Sponsored Products, Sponsored Brands, and Sponsored Display — then manages them daily to protect your margins and maximize your return. For business owners and CMOs accountable to revenue targets, we track the metrics that matter: ACoS, ROAS, revenue contribution, and organic rank lift driven by advertising investment. You&apos;ll receive weekly performance summaries and monthly strategic reports that your leadership team can actually use. We treat your ad spend the same way we&apos;d treat our own: with discipline, urgency, and a constant bias toward efficiency.
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
                  <li>Sponsored Products campaign management</li>
                  <li>Sponsored Brands &amp; video campaigns</li>
                  <li>Sponsored Display &amp; DSP strategy</li>
                  <li>Daily bid &amp; budget optimization</li>
                  <li>Weekly performance summaries</li>
                  <li>Monthly strategic reports</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>
                  Business owners and CMOs accountable to revenue targets who need disciplined, transparent ad management.
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
