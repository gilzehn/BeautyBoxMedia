import Link from 'next/link';
import styles from '../page.module.css';

export default function ConsultingPage() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon &middot; Consulting &amp; Advisory</span>
          <h1 className={styles.title}>
            Consulting &amp; <span className="accent-text">Advisory.</span>
          </h1>
          <p className={styles.intro}>
            <em>The right conversation with the right expert at the right time.</em>
          </p>
          <p className={styles.subtitle}>
            Sometimes the highest-value move isn&apos;t a full retainer — it&apos;s the right conversation with the right expert at the right time. BEAUTYBOXMEDIA&apos;s consulting service gives business owners, CMOs, and BizDev leaders direct access to senior Amazon strategists who have seen what works across dozens of beauty and fashion categories. Whether you need a rapid account audit, a second opinion on your launch strategy, or on-demand tactical guidance during a critical growth moment, we&apos;re available on a flexible hourly or prepaid block basis. No junior account managers. No templated advice. Just senior-level thinking applied directly to your specific challenge.
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
                  <li>Rapid account audit &amp; health check</li>
                  <li>Launch strategy review &amp; second opinion</li>
                  <li>On-demand tactical guidance</li>
                  <li>Flexible hourly or prepaid block engagements</li>
                  <li>Senior-level strategists (no junior handoffs)</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>
                  Business owners, CMOs, and BizDev leaders who need expert Amazon guidance without committing to a full retainer.
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
