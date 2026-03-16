import Link from 'next/link';
import styles from '../../marketplaces/page.module.css';

export default function AudienceTargeting() {
  return (
    <>
      <section className={styles.header}>
        <div className="container">
          <span className={styles.tagline}>Growth &amp; Data Services</span>
          <h1 className={styles.title}>
            Audience Targeting &amp; Data <span className="accent-text">Strategy.</span>
          </h1>
          <p className={styles.subtitle}>
            Reaching the right person with the right message on the right platform is not a creative challenge, it is a data challenge. We build the audience architecture that ensures every campaign dollar is spent on the people most likely to buy your product and keep buying it.
          </p>
          <p className={styles.subtitle} style={{ marginTop: '20px' }}>
            We design and implement layered audience strategies across every platform your brand operates on. Custom audiences built from your highest-value customers, lookalike models that find more people just like them, and behavioral targeting layers built around beauty routines, skincare concerns, and purchase intent signals. Exclusion logic protects your budget by removing already-converted customers and low-intent segments. For CMOs and performance marketing leads accountable to CAC and ROAS targets, a sophisticated audience strategy is the difference between a campaign that scales and one that plateaus.
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
                  <li>Custom audience build from email list, site visitors, and purchaser data</li>
                  <li>Lookalike audience modeling from highest-value customer cohorts</li>
                  <li>Interest and behavioral targeting strategy across Meta and Google</li>
                  <li>Competitor audience targeting strategy</li>
                  <li>Exclusion audience setup to protect budget efficiency</li>
                  <li>Audience segmentation by skin concern, purchase behavior, and product affinity</li>
                  <li>Cross-platform audience alignment strategy</li>
                  <li>Ongoing audience testing and optimization</li>
                  <li>Monthly audience performance reporting</li>
                </ul>
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.content}>
                <h2 className={styles.itemTitle}>Who This Is For</h2>
                <p className={styles.itemDesc}>
                  CMOs and performance marketing leads who feel their campaigns are reaching the wrong people. Brands scaling their paid media spend who need a more sophisticated targeting infrastructure. Business owners who want to reduce CAC without reducing reach. Any brand launching a new product or entering a new market segment that needs a precise audience strategy from day one.
                </p>
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
            Build Your Audience Strategy
          </Link>
        </div>
      </section>
    </>
  );
}
