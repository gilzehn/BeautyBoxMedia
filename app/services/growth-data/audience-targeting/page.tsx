import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function AudienceTargeting() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Growth &middot; Audience Targeting &amp; Data Strategy</span>
          <h1 className={styles.title}>
            Audience Targeting &amp; Data <span className="accent-text">Strategy.</span>
          </h1>
          <p className={styles.intro}>
            <em>Reach the right people with the right message.</em>
          </p>
          <p className={styles.subtitle}>We build data-driven audience segments, lookalike models, and targeting strategies that connect your beauty brand with high-intent customers across every platform. From first-party data activation to cross-channel audience syncing, our data strategy ensures your marketing spend reaches the people most likely to convert — and keeps reaching them as they move through the funnel.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>First-party data activation &amp; segmentation</li>
                  <li>Lookalike audience modeling</li>
                  <li>Cross-channel audience syncing</li>
                  <li>High-intent customer targeting</li>
                  <li>Funnel-stage audience mapping</li>
                  <li>Ongoing audience performance optimization</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>Marketing leaders who want to stop wasting ad spend and start reaching the customers who actually convert.</p>
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
