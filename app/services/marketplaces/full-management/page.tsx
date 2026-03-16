import Link from 'next/link';
import styles from '../page.module.css';

export default function FullManagementPage() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Amazon &middot; Full Account Management</span>
          <h1 className={styles.title}>
            Full Account <span className="accent-text">Management.</span>
          </h1>
          <p className={styles.intro}>
            <em>For brand owners who want Amazon fully handled.</em>
          </p>
          <p className={styles.subtitle}>
            BEAUTYBOXMEDIA takes complete ownership of your Amazon business: catalog management, inventory coordination, technical issue resolution, policy compliance, advertising, and reporting. We function as a dedicated extension of your team, embedded in your account and accountable to your growth targets. Founders and CMOs who work with us stop worrying about Amazon and start seeing it as the revenue engine it should be. There&apos;s no operational detail too small and no strategic challenge too large — we own it all so you can stay focused on building the brand.
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
                  <li>Complete catalog management</li>
                  <li>Inventory coordination &amp; forecasting</li>
                  <li>Technical issue resolution</li>
                  <li>Policy compliance monitoring</li>
                  <li>Full advertising management</li>
                  <li>Monthly performance reporting &amp; strategy calls</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>
                  Founders and CMOs who want a dedicated partner managing every aspect of their Amazon business.
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
