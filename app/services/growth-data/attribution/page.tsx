import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function Attribution() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Growth &middot; Attribution Modeling</span>
          <h1 className={styles.title}>
            Attribution <span className="accent-text">Modeling.</span>
          </h1>
          <p className={styles.intro}>
            <em>Understand the true value of every touchpoint.</em>
          </p>
          <p className={styles.subtitle}>We implement multi-touch attribution frameworks that reveal how your marketing channels work together, helping you allocate budget where it matters most. In a world where last-click attribution dramatically undervalues upper-funnel investment, our models show the real contribution of every channel — from first touch to final conversion — so you can invest with confidence.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className={styles.list}>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>What&apos;s Included</h2>
                <ul className={styles.includedList}>
                  <li>Multi-touch attribution framework setup</li>
                  <li>Cross-channel contribution analysis</li>
                  <li>Upper-funnel investment valuation</li>
                  <li>Budget allocation recommendations</li>
                  <li>Attribution model calibration &amp; testing</li>
                  <li>Quarterly model review &amp; refinement</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who It&apos;s For</h2>
                <p className={styles.itemDesc}>CMOs and finance leaders who need to understand the true ROI of every marketing channel.</p>
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
